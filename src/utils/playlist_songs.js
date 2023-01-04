const mapDBToModel = ({
  id,
  playlist_id,
  song_id,
  created_at,
  updated_at,
}) => ({
  id,
  playlist_id,
  song_id,
  createdAt: created_at,
  updatedAt: updated_at,
});

module.exports = { mapDBToModel };
