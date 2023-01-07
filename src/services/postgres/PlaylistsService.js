const { nanoid } = require('nanoid');
const { Pool } = require('pg');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');
const AuthorizationError = require('../../exceptions/AuthorizationError');

class PlaylistsService {
  constructor(collaboratorService) {
    this._pool = new Pool();
    this._collaborationService = collaboratorService;
  }

  async addPlaylist({ name, user_id }) {
    const id = `playlist-${nanoid(16)}`;
    const createdAt = new Date().toISOString();
    const updatedAt = createdAt;

    const query = {
      text: 'INSERT INTO playlists VALUES($1, $2, $3, $4, $5) RETURNING id',
      values: [id, name, user_id, createdAt, updatedAt],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError('Playlist gagal ditambahkan');
    }

    return result.rows[0].id;
  }

  // mengambil data playlists
  async getPlaylists(owner) {
    const query = {
      text: `SELECT playlists.id, playlists.name, users.username FROM playlists
        LEFT JOIN collaborations ON collaborations.playlist_id = playlists.id
        LEFT JOIN users ON users.id = playlists.owner
        WHERE playlists.owner = $1 OR collaborations.user_id = $1
        GROUP BY playlists.id, users.username`,
      values: [owner],
    };

    const result = await this._pool.query(query);
    return result.rows;
  }

  async deletePlaylist({ playlistId, userId }) {
    await this.verifyPlaylistOwner(playlistId, userId);

    const query = {
      text: 'DELETE FROM playlists WHERE id = $1 RETURNING id',
      values: [playlistId],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Playlist gagal dihapus. Id tidak ditemukan');
    }
  }

  async getPlaylistsForSong(playlistId, userId) {
    const query = {
      text: `SELECT playlists.*, users.username FROM playlists
      LEFT JOIN users ON playlists.user_id = users.id
      WHERE playlists.id = $2 AND playlists.user_id=$1`,
      values: [userId, playlistId],
    };
    const result = await this._pool.query(query);

    return result.rows[0];
  }

  async verifyPlaylistOwner(playlistId, userId) {
    const query = {
      text: 'SELECT * FROM playlists WHERE id = $1',
      values: [playlistId],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Playlist tidak ditemukan');
    }

    if (result.rows[0].owner !== userId) {
      throw new AuthorizationError('Anda tidak berhak mengakses resource ini');
    }
  }

  async verifyPlaylistAccess(playlistId, userId) {
    try {
      await this.verifyPlaylistOwner(playlistId, userId);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      try {
        await this._collaborationService.verifyCollaborator(playlistId, userId);
      } catch {
        throw error;
      }
    }
  }

  async verifySongInPlaylist(songId) {
    const query = {
      text: 'SELECT * FROM songs WHERE id = $1',
      values: [songId],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Lagu tidak ditemukan di playlist ini');
    }
  }

  async getPlaylistActivitiesById(playlistId) {
    const query = {
      text: `SELECT users.username, songs.title, playlist_song_activities.action, playlist_song_activities.time 
        FROM playlist_song_activities
        JOIN songs ON songs.id = playlist_song_activities.song_id
        JOIN users ON users.id = playlist_song_activities.user_id
        WHERE playlist_song_activities.playlist_id = $1`,
      values: [playlistId],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Playlist tidak ditemukan');
    }

    return result.rows;
  }
}

module.exports = PlaylistsService;
