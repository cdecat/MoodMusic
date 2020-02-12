const db = require('./db').conn();

// Update Playlist model with up to date playlist data and inserts new ones.
exports.update = playlists => {
  let changes = false;
  const insertSQL = `INSERT INTO playlists (
                     id, name, snapshot_id, changes, tracking)
                     VALUES (?, ?, ?, ?, ?)`;
  const updateSQL = `UPDATE playlists
                     SET snapshot_id=?, changes=?
                     WHERE id=? AND snapshot_id!=?`;
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run("BEGIN TRANSACTION");
      playlists.forEach(pl => {
        // Insert
        const values = [pl.id, pl.name, pl.snapshot_id, 1, 0];
        db.run(insertSQL, values, err => {
          if (err && err.code !== 'SQLITE_CONSTRAINT') {
            reject(err);
          } else if (!err) {
            changes = true;
            console.log(`Playlist added: '${pl.name}'`);
          }
        });
        // Update
        const values2 = [pl.snapshot_id, 1, pl.id, pl.snapshot_id];
        db.run(updateSQL, values2, function(err) {
          if (err) {
            reject(err);
          } else if (this.changes) {
            changes = true;
            console.log(`Playlist changed: '${pl.name}'`)
          }
        });
      })
      db.run("COMMIT TRANSACTION", err => {
        if (err) {
          reject(err);
        } else if (changes) {
          resolve({
            message: 'Playlists Updated!',
            changes: true,
          })
        } else {
          resolve({
            message: 'No Updates',
            changes: false,
          })
        }
      });
    });
  });
};

// Create playlist locally
exports.create = playlist => {
  return new Promise((resolve, reject) => {
    const sql = `INSERT INTO playlists (
                 id, name, snapshot_id, mood_playlist, changes)
                 VALUES (?, ?, ?, ?, ?)`;
    const values = [playlist.id, playlist.name, playlist.snapshot_id, 1, 0];
    db.run(sql, values, err => err ? reject(err) : resolve());
  });
};
// Delete playlist locally
exports.delete = id => {
  return new Promise((resolve, reject) => {
    const sql = `DELETE FROM playlists WHERE id=?`;
    db.run(sql, [id], err => err ? reject(err) : resolve());
  });
};
// Modify playlist fields (api call)
// TODO: remove or change (no more async validation)
exports.modify = async (id, update) => {
  try {
    // Check if playlist_id exists
    await getRow(id);
    const fields = {
      tracking: update.tracking,
      genre_id: update.genre_id,
      mood_playlist: update.mood_playlist
    };
    const fieldsValues = Object.values(fields)
      .filter(val => val != null)
      .map(val => typeof(val) === 'boolean' ? +val : val); 
    if (!fieldsValues.length) { return 'No valid fields to modify'; }
    const fieldsSQL = Object.keys(fields)
      .filter(key => fields[key] != null)
      .map(key => key + '=?')
      .join(', ');
    // Validate genre_id
    const validId = await validGenreId(update.genre_id);
    if (!validId) { return 'Invalid genre_id'; }
    // Update fields
    const message = await new Promise((resolve, reject) => {
      const sql = "UPDATE playlists SET " + fieldsSQL + " WHERE id=?";
      db.run(sql, [...fieldsValues, id], err => err
        ? reject(err)
        : resolve(`Updated playlist id: ${id}`));
    });
    return message;
  } catch (err) {
    console.log(err);
    return err;
  }
};
// Modify multiple playlists (settings fields)
exports.modifyMany = arr => {
  return new Promise((resolve, reject) => {
    const genreChanges = []; // Store genre changes here
    db.serialize(() => {
      db.run("BEGIN TRANSACTION");
      arr.forEach(pl => {
        // Add genre_id if it exists with validation
        if (pl.genre_id) {
          const sql = `UPDATE playlists SET genre_id=? WHERE id=? AND (
                        SELECT 1 FROM labels WHERE id=? AND type='genre')`;
          const values = [pl.genre_id, pl.playlist_id, pl.genre_id];
          db.run(sql, values, function(err) {
            if (err) {
              reject(Error(err));
            } else if (this.changes) {
              genreChanges.push({
                playlist_id: pl.playlist_id,
                genre_id: pl.genre_id,
              });
            }
          });
        }
        // Add other fields normally
        const fields = {
          ...pl.tracking !== undefined && { tracking: +pl.tracking },
          ...pl.mood_playlist !== undefined && { mood_playlist: +pl.mood_playlist }
        };
        if (!Object.values(fields).length) return;
        const fieldsSQL = Object.keys(fields).map(key => key + '=?').join(', ');
        const sql = "UPDATE playlists SET " + fieldsSQL + " WHERE id=?";
        const values = [...Object.values(fields), pl.playlist_id];
        db.run(sql, values, err => err ? reject(Error(err)) : null);
      });
      db.run("COMMIT TRANSACTION", err => {
        if (err) {
          reject(Error(err));
        } else {
          resolve(genreChanges);
        }
      });
    });
  });
}
// Set playlist 'changes' true/false
exports.setChanges = (id, bool) => {
  return new Promise((resolve, reject) => {
    const sql = `UPDATE playlists SET changes=? WHERE id=?`;
    db.run(sql, [bool ? 1 : 0, id], err => err ? reject(err) : resolve('success'));
  });
};

// Get all playlists
exports.getAll = async () => {
  try {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM playlists', (err, rows) => {
        if (err) {
          reject(err);
        } else {
          const byId = rows.reduce((obj, row) => ({
            ...obj,
            [row.id]: row
          }), {});
          resolve(byId);
        }
      });
    });
  } catch (err) {
    throw new Error(err.message);
  }
};
// Get playlist by id
exports.get = id => {
  return getRow(id);
};

/* Helper functions */
// Checks if a given label_id is of type 'genre'
const validGenreId = id => {
  if (!id) { return Promise.resolve(false); }
  return new Promise((resolve, reject) => {
    const sql = "SELECT 1 FROM labels WHERE id=? AND type='genre'";
    db.get(sql, id, (err, row) => {
      row ? resolve(true) : resolve(false)
    });
  });
};
// Returns playlist_id row object
const getRow = id => {
  return new Promise((resolve, reject) => {
    db.get("SELECT * FROM playlists WHERE id=?", [id], (err, row) => {
      if (err) reject(err);
      else if (row) resolve(row);
      else reject(`Playlist id: '${id}' not found.`);
    });
  });
};