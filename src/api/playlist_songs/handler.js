class PlaylistSongsHandler {
  constructor(playlistSongsService, playlistsService, songsService, validator) {
    this._playlistSongsService = playlistSongsService;
    this._playlistService = playlistsService;
    this._songsService = songsService;
    this._validator = validator;

    this.postPlaylistSongHandler = this.postPlaylistSongHandler.bind(this);
    this.getPlaylistSongHandler = this.getPlaylistSongHandler.bind(this);
    this.deletePlaylistSongHandler = this.deletePlaylistSongHandler.bind(this);
    this.getPlaylistActivitiesHandler = this.getPlaylistActivitiesHandler.bind(this);
  }

  async postPlaylistSongHandler(request, h) {
    this._validator.validatePlaylistSongPayload(request.payload);

    const { id: credentialId } = request.auth.credentials;
    const { songId } = request.payload;
    const { id: playlistId } = request.params;

    await this._songsService.verifySongExists(songId);
    await this._playlistService.verifyPlaylistAccess(playlistId, credentialId);
    await this._playlistSongsService.addSongToPlaylist({
      songId, playlistId, userId: credentialId,
    });

    const response = h.response({
      status: 'success',
      message: 'Lagu berhasil ditambahkan ke playlist',
    });
    response.code(201);
    return response;
  }

  async getPlaylistSongHandler(request) {
    const { id: playlistId } = request.params;
    const { id: user_id } = request.auth.credentials;

    await this._playlistService.verifyPlaylistAccess(playlistId, user_id);
    const playlist = await this._playlistSongsService.getPlaylistIdSongs(playlistId, user_id);

    return {
      status: 'success',
      data: {
        playlist,
      },
    };
  }

  async deletePlaylistSongHandler(request) {
    this._validator.validatePlaylistSongPayload(request.payload);
    const { id: playlistId } = request.params;
    const { songId } = request.payload;
    const { id: userId } = request.auth.credentials;

    await this._playlistService.verifyPlaylistAccess(playlistId, userId);
    await this._playlistSongsService.deleteSongFromPlaylist(playlistId, songId, userId);

    return {
      status: 'success',
      message: 'Lagu berhasil dihapus dari playlist',
    };
  }

  async getPlaylistActivitiesHandler(request) {
    const { id: playlistId } = request.params;
    const { id: userId } = request.auth.credentials;

    await this._playlistService.verifyPlaylistOwner(playlistId, userId);
    const playlistActivities = await this._playlistService.getPlaylistActivitiesById(playlistId);

    return {
      status: 'success',
      data: {
        playlistId,
        activities: playlistActivities,
      },
    };
  }
}

module.exports = PlaylistSongsHandler;
