/* eslint-disable camelcase */

exports.up = pgm => {
  // mengubah nama kolom user_id menjadi owner
  pgm.renameColumn('playlists', 'user_id', 'owner');
};

exports.down = pgm => {
  // mengembalikan nama kolom owner menjadi user_id
  pgm.renameColumn('playlists', 'owner', 'user_id');
};
