const mapDBToModel = ({
  id,
  name,
  user_id,
  created_at,
  updated_at,
}) => ({
  id,
  name,
  user_id,
  createdAt: created_at,
  updatedAt: updated_at,
});

module.exports = { mapDBToModel };
