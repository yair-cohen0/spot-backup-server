import { AppService } from "./app.service";
import {
    Controller,
    Delete,
    Get,
    HttpException,
    Post, Put,
    Req,
    Res,
    Session,
    UploadedFile,
    UseInterceptors
} from "@nestjs/common";
import { Express, Request, Response } from "express";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import { extname } from "path";
import * as fs from "fs";

@Controller()
export class AppController {
    constructor(private readonly appService: AppService) {
    }

    private headers = {
        //   "Access-Control-Allow-Origin": "http://127.0.0.1:8080",
        //   "Access-Control-Allow-Credentials": "false",
        //   "Access-Control-Allow-Headers": "*",
    };

    @Post("import")
    async import(@Req() request: Request, @Res() response: Response, @Session() session: Record<string, any>) {
        await this.appService.import(
            request.body.id,
            session.token,
            session.importFile,
            request.body.playlists
        );

        response
            .set(this.headers)
            .status(200)
            .send({ msg: "synced data", status: 200 });
    }

    @Put("export")
    async export(@Req() request: Request, @Res() response: Response, @Session() session: Record<string, any>) {
        session.exportFile = await this.appService.export(
            request.body.id,
            session.token
        );

        response
            .set(this.headers)
            .status(201)
            .send({ msg: "created file", status: 201 });
    }

    @Get("download")
    async download(@Req() request: Request, @Res() response: Response, @Session() session: Record<string, any>) {
        const filePath = session.exportFile;

        fs.access(filePath, fs.constants.R_OK, (err) => {
            if (err) {
                response.set(this.headers).status(401).send("No Access");
            } else {
                response.set(this.headers).download(filePath, (error) => {
                    if (error) {
                        throw new Error("Download Error");
                    }
                    setTimeout(async () => {
                        await this.appService.deleteFile(filePath);
                    }, 10000);
                });
            }
        });
    }

    @Post("upload")
    @UseInterceptors(
        FileInterceptor("file", {
            storage: diskStorage({
                destination: "files/uploads",
                filename: (req, file, callback) => {
                    if (file.mimetype != "application/json") {
                        callback(new HttpException("Wrong file type", 400), null);
                        return;
                    }

                    const randomName = Array(32)
                        .fill(null)
                        .map(() => Math.round(Math.random() * 16).toString(16))
                        .join("");
                    callback(null, `${randomName}${extname(file.originalname)}`);
                }
            }),
            limits: { fileSize: 1000000 }
        })
    )
    async upload(
        @UploadedFile() file: Express.Multer.File,
        @Res() res: Response,
        @Session() session: Record<string, any>
    ) {
        console.log("Uploaded file: ", file.filename);
        session.importFile = `files\\uploads\\${file.filename}`;
        const playlistsData = await this.appService.getPlaylistsData(
            file.filename
        );
        res.set(this.headers).status(200).send({
            msg: "File Uploaded",
            status: 201,
            playlists: playlistsData
        });
    }

    @Post("delete")
    async removeFile(@Req() request: Request, @Res() response: Response, @Session() session: Record<string, any>) {
        try {
            await this.appService.deleteFile(session.exportFile);
            session.exportFile = "";
            await this.appService.deleteFile(session.importFile);
            session.importFile = "";
        } catch (e) {
            throw new HttpException('Internal Error', 500);
        }
        response
            .status(200)
            .send("Success")
    }

    @Post("token")
    async saveToken(@Req() request: Request, @Res() response: Response, @Session() session: Record<string, any>) {
        if (request.body.e && await this.appService.validateToken(request.body.e as string)) {
            session.token = request.body.e;
            response
                .status(200)
                .send({ msg: "OK", status: 200 });
        } else {
            response
                .status(500)
                .send({ msg: "Token Error", status: 500 });
        }
    }

    @Delete("token")
    removeToken(@Session() session: Record<string, any>): void {
        session.token = undefined;
    }

}
