-- Migration: Système d'invitation pour héritiers
-- Seuls les utilisateurs inscrits peuvent être héritiers via code/QR

-- 1. Modifier la table heirs pour le système d'invitation
ALTER TABLE heirs
  -- Rendre heir_user_id nullable temporairement (sera rempli après acceptation)
  ALTER COLUMN heir_user_id DROP NOT NULL,
  
  -- Ajouter les colonnes pour le système d'invitation
  ADD COLUMN IF NOT EXISTS invitation_code TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS invitation_status TEXT DEFAULT 'pending' CHECK (invitation_status IN ('pending', 'accepted', 'rejected', 'expired')),
  ADD COLUMN IF NOT EXISTS invitation_expires_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP WITH TIME ZONE;

-- 2. Supprimer les colonnes chiffrées (plus nécessaires car on utilise heir_user_id)
ALTER TABLE heirs
  DROP COLUMN IF EXISTS full_name_encrypted,
  DROP COLUMN IF EXISTS email_encrypted,
  DROP COLUMN IF EXISTS phone_encrypted,
  DROP COLUMN IF EXISTS relationship_encrypted;

-- 3. Ajouter une colonne pour la relation (non chiffrée, optionnelle)
ALTER TABLE heirs
  ADD COLUMN IF NOT EXISTS relationship TEXT;

-- 4. Créer des index pour les performances
CREATE INDEX IF NOT EXISTS idx_heirs_invitation_code 
  ON heirs(invitation_code) 
  WHERE invitation_code IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_heirs_invitation_status 
  ON heirs(invitation_status);

CREATE INDEX IF NOT EXISTS idx_heirs_heir_user_id 
  ON heirs(heir_user_id) 
  WHERE heir_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_heirs_expires_at 
  ON heirs(invitation_expires_at) 
  WHERE invitation_expires_at IS NOT NULL;

-- 5. Créer une fonction pour générer un code d'invitation unique
CREATE OR REPLACE FUNCTION generate_invitation_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    -- Générer un code au format SIGN-XXXXXX (6 caractères alphanumériques)
    code := 'SIGN-' || upper(substring(md5(random()::text) from 1 for 6));
    
    -- Vérifier si le code existe déjà
    SELECT EXISTS(SELECT 1 FROM heirs WHERE invitation_code = code) INTO exists;
    
    -- Si le code n'existe pas, le retourner
    IF NOT exists THEN
      RETURN code;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 6. Créer une fonction pour nettoyer les invitations expirées
CREATE OR REPLACE FUNCTION cleanup_expired_invitations()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE heirs
  SET invitation_status = 'expired'
  WHERE invitation_status = 'pending'
    AND invitation_expires_at < NOW()
    AND invitation_expires_at IS NOT NULL;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- 7. Créer une vue pour les héritiers avec les informations utilisateur
CREATE OR REPLACE VIEW heirs_with_user_info AS
SELECT 
  h.id,
  h.user_id,
  h.heir_user_id,
  h.inheritance_plan_id,
  h.relationship,
  h.access_level,
  h.is_active,
  h.has_accepted,
  h.accepted_at,
  h.invitation_code,
  h.invitation_status,
  h.invitation_expires_at,
  h.invited_at,
  h.rejected_at,
  h.notify_on_activation,
  h.notification_delay_days,
  h.heir_public_key,
  h.created_at,
  h.updated_at,
  -- Informations de l'héritier (si accepté)
  u.email as heir_email,
  u.full_name as heir_full_name,
  u.avatar_url as heir_avatar_url,
  -- Informations du propriétaire
  owner.email as owner_email,
  owner.full_name as owner_full_name
FROM heirs h
LEFT JOIN users u ON h.heir_user_id = u.id
LEFT JOIN users owner ON h.user_id = owner.id;

-- 8. Mettre à jour les politiques RLS
DROP POLICY IF EXISTS "Users can view their own heirs" ON heirs;
DROP POLICY IF EXISTS "Users can insert their own heirs" ON heirs;
DROP POLICY IF EXISTS "Users can update their own heirs" ON heirs;
DROP POLICY IF EXISTS "Users can delete their own heirs" ON heirs;

-- SELECT: Le propriétaire peut voir ses héritiers, l'héritier peut voir ses propres infos
-- ET tout utilisateur authentifié peut lire une invitation par son code (pour l'accepter)
CREATE POLICY "Users can view their heirs and heirs can view their info"
ON heirs FOR SELECT
USING (
  auth.uid() = user_id OR 
  auth.uid() = heir_user_id OR
  (invitation_status = 'pending' AND invitation_code IS NOT NULL)
);

-- INSERT: Les utilisateurs peuvent créer des invitations d'héritiers
CREATE POLICY "Users can create heir invitations"
ON heirs FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- UPDATE: Les propriétaires peuvent modifier leurs héritiers, les héritiers peuvent accepter/rejeter
CREATE POLICY "Users can update their heirs and accept invitations"
ON heirs FOR UPDATE
USING (
  auth.uid() = user_id OR 
  auth.uid() = heir_user_id OR
  (invitation_status = 'pending' AND heir_user_id IS NULL)
)
WITH CHECK (
  auth.uid() = user_id OR 
  auth.uid() = heir_user_id OR
  (invitation_status IN ('accepted', 'rejected'))
);

-- DELETE: Seul le propriétaire peut supprimer
CREATE POLICY "Users can delete their own heirs"
ON heirs FOR DELETE
USING (auth.uid() = user_id);

-- 9. Ajouter des commentaires
COMMENT ON COLUMN heirs.invitation_code IS 'Code unique pour inviter un héritier (format: SIGN-XXXXXX)';
COMMENT ON COLUMN heirs.invitation_status IS 'Statut de l''invitation: pending, accepted, rejected, expired';
COMMENT ON COLUMN heirs.invitation_expires_at IS 'Date d''expiration de l''invitation (7 jours par défaut)';
COMMENT ON COLUMN heirs.invited_at IS 'Date de création de l''invitation';
COMMENT ON COLUMN heirs.rejected_at IS 'Date de rejet de l''invitation';
COMMENT ON COLUMN heirs.relationship IS 'Relation avec l''héritier (ex: fils, fille, conjoint)';

-- 10. Créer un trigger pour définir automatiquement la date d'expiration
CREATE OR REPLACE FUNCTION set_invitation_expiration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.invitation_code IS NOT NULL AND NEW.invitation_expires_at IS NULL THEN
    NEW.invitation_expires_at := NOW() + INTERVAL '7 days';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_invitation_expiration_trigger
  BEFORE INSERT ON heirs
  FOR EACH ROW
  EXECUTE FUNCTION set_invitation_expiration();

-- 11. Permissions
GRANT SELECT ON heirs_with_user_info TO authenticated;
GRANT EXECUTE ON FUNCTION generate_invitation_code() TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_invitations() TO authenticated;
