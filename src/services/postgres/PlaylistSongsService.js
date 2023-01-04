const { Pool } = require('pg');
const { nanoid } = require('nanoid');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');

class PlaylistSongsService {
  constructor(playlistService) {
    this._pool = new Pool();
    this._playlistService = playlistService;
  }

  async addSongToPlaylist({ songId, playlistId, userId }) {
    await this._playlistService.verifySongInPlaylist(songId);
    const id = `playlistsongs-${nanoid(16)}`;

    const playlistActivitiesId = `playlistactivities-${nanoid(16)}`;
    await this._pool.query('BEGIN');

    const query = {
      text: 'INSERT INTO playlist_songs VALUES ($1, $2, $3) RETURNING id',
      values: [id, playlistId, songId],
    };

    const playlistActivityQuery = {
      text: 'INSERT INTO playlist_song_activities VALUES($1, $2, $3, $4, $5, $6) RETURNING id',
      values: [playlistActivitiesId, playlistId, songId, userId, 'add', new Date().toISOString()],
    };

    const result = await this._pool.query(query);
    const activityResult = await this._pool.query(playlistActivityQuery);

    if (!result.rows[0].id || !activityResult.rows[0].id) {
      await this._pool.query('ROLLBACK');
      throw new InvariantError('Lagu gagal ditambahkan kedalam playlist');
    }

    await this._pool.query('COMMIT');
  }

  async getPlaylistIdSongs(userId) {
    const playlistQuery = {
      text: `SELECT playlists.id, playlists.name, users.username FROM playlists
      LEFT JOIN users ON users.id = playlists.user_id
      WHERE playlists.id = $1`,
      values: [userId],
    };
    const songsQuery = {
      text: `SELECT songs.id, songs.title, songs.performer FROM playlist_songs
      LEFT JOIN songs ON songs.id = playlist_songs.song_id
      WHERE playlist_songs.playlist_id = $1`,
      values: [userId],
    };

    const playlistResult = await this._pool.query(playlistQuery);
    const songsResult = await this._pool.query(songsQuery);

    if (!playlistResult.rows.length) {
      throw new NotFoundError('Playlist tidak ditemukan');
    }

    const playlist = playlistResult.rows[0];
    return {
      ...playlist,
      songs: songsResult.rows,
    };
  }

  async deleteSongFromPlaylist(playlistId, songId, userId) {
    await this._playlistService.verifySongInPlaylist(songId);

    const playlistActivitiesId = `playlistactivities-${nanoid(16)}`;

    const query = {
      text: 'DELETE FROM playlist_songs WHERE playlist_id = $1 AND song_id = $2 RETURNING id',
      values: [playlistId, songId],
    };

    const queryActivities = {
      text: 'INSERT INTO playlist_song_activities VALUES($1, $2, $3, $4, $5, $6) RETURNING id',
      values: [playlistActivitiesId, playlistId, songId, userId, 'delete', new Date().toISOString()],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Album gagal dihapus. Id tidak ditemukan');
    }

    const resultActivity = await this._pool.query(queryActivities);

    if (resultActivity.rows[0].id === 1) {
      throw new InvariantError('Aktivitas gagal ditambahkan');
    }
  }
}

module.exports = PlaylistSongsService;
