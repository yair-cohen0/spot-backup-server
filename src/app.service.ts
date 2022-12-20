import { Injectable, HttpException } from "@nestjs/common";
import * as fs from "fs";
import fetch from "node-fetch";
import axios from "axios";
import {ConfigService} from "@nestjs/config";


@Injectable()
export class AppService {

    constructor(private configService: ConfigService) {
    }
    async clearProfile(id, token) {
        const playlists = await this.getUserPlaylists(id, token);

        for (const playlist of playlists) {
            await fetch(
                `https://api.spotify.com/v1/playlists/${playlist.id}/followers`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": `application/json`
                    }
                }
            );
        }
    }

    async import(id, token, filePath, requestedPlaylists) {
        const self = this;

        const fileText = await self.readFile(filePath);

        const filePlaylists = JSON.parse(fileText);


        const errors = [];

        const creatorId = filePlaylists[0].creatorId;

        for (let i = 1; i < filePlaylists.length; i++) {
            if (!requestedPlaylists.includes(filePlaylists[i].id)) {
                continue;
            }

            if (filePlaylists[i].owner.id != creatorId) {
                self.followPlaylist(
                    filePlaylists[i].id,
                    filePlaylists[i].public,
                    token
                );
                continue;
            }

            const response = await fetch(
                `https://api.spotify.com/v1/users/${id}/playlists`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": `application/json`
                    },
                    body: JSON.stringify({
                        name: filePlaylists[i].name,
                        public: filePlaylists[i].public,
                        collaborative: filePlaylists[i].collaborative,
                        description: filePlaylists[i].description
                    })
                }
            );

            const data = await response.json();

            if (data.error) {
                if (data.error.message === 'Invalid access token' || data.error.status == 401) {
                    throw new HttpException('Unauthorized', 401);
                }
                else {
                    errors.push(filePlaylists[i].id);
                    continue;
                }
            }

            const playlistId = data.id;

            await self.insertSongs(playlistId, filePlaylists[i].tracks.list, token);
        }

        if (errors.length) {
            await this.logError("Found creation errors");
            await this.import(id, token, filePath, errors);
        }

        await this.deleteFile(filePath);

        return true;
    }

    async followPlaylist(playlistId, playlistPublic, token) {
        const response = await fetch(
            `https://api.spotify.com/v1/playlists/${playlistId}/followers`,
            {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": `application/json`
                },
                data: JSON.stringify({
                    public: playlistPublic
                })
            }
        );

        const data = await response;

        if (data.error) {
            this.logError("Follow error");
            return;
        }

        return data.status;
    }

    async insertSongs(playlistId, songsList, token) {
        songsList = songsList.filter(function(value) {
            return !value.includes("local");
        });

        for (let i = 0; i < songsList.length; i += 100) {
            const slice = songsList.slice(i, i + 100);
            const response = await fetch(
                `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": `application/json`
                    },
                    body: JSON.stringify({
                        position: i,
                        uris: slice
                    })
                }
            );
            const data = await response.json();

            if (data.error) {
                await this.logError("Songs insertion error");
                return;
            }
        }
    }

    async readFile(filePath: string): Promise<string> {
        return new Promise<string>((ok, fail) => {
            fs.readFile(filePath, (err, data) =>
                err ? fail(err) : ok(data.toString())
            );
        });
    }

    async export(id, token) {
        const playlists = await this.getUserPlaylists(id, token);

        playlists.unshift({ creatorId: id });

        for (let i = 1; i < playlists.length; i++) {
            if (playlists[i].owner.id != id) continue;

            let url = playlists[i].tracks.href;
            playlists[i].tracks.list = [];

            while (url != null) {
                const response = await fetch(url, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": `application/json`
                    }
                });
                const data = await response.json();

                if (data.error)
                    throw new HttpException(data.error["message"], data.error["status"]);

                data.items.forEach((item) => {
                    playlists[i].tracks.list.push(item.track.uri);
                });

                url = data.next;
            }
        }
        const fileName =
            Array(32)
                .fill(null)
                .map(() => Math.round(Math.random() * 16).toString(16))
                .join("") + ".json";

        const filePath = `.\\files\\downloads\\${fileName}`;

        fs.writeFile(filePath, JSON.stringify(playlists), (e) => {
            if (e) {
                throw new Error(e.message);
            }
            console.log("Created File Successfully: " + filePath)
        });

        return filePath;
    }

    async getUserPlaylists(id, token): Promise<any[]> {
        const playlists = [];
        let url = `https://api.spotify.com/v1/me/playlists?offset=0&limit=20`;

        while (url != null) {
            const response = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": `application/json`
                }
            });
            const data = await response.json();

            if (data.error)
                throw new HttpException(data.error["message"], data.error["status"]);

            data.items.forEach((item) => {
                playlists.push(item);
            });

            url = data.next;
        }

        return playlists;
    }

    async getPlaylistsData(fileName: string) {
        const fileText = await this.readFile(`.\\files\\uploads\\${fileName}`);
        const filePlaylists = JSON.parse(fileText);

        const playlistsData = [];

        for (let i = 1; i < filePlaylists.length; i++) {
            playlistsData.push({
                name: filePlaylists[i].name,
                id: filePlaylists[i].id
            });
        }

        return playlistsData;
    }

    async logError(text) {
        console.log(text);
    }

    async validateToken(token: string): Promise<boolean> {
        return axios.get("https://api.spotify.com/v1/me", {
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        }).then(e => {
            return e.status === 200;
        }).catch((e) => {
            return false;
        });
    }

    async deleteFile(filePath: string): Promise<void> {
        fs.access(filePath, fs.constants.R_OK, (err) => {
            if (!err) {
                fs.unlinkSync(filePath);
            }
        });
    }
}
