import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { NestExpressApplication } from "@nestjs/platform-express";
import { CorsOptions } from "cors";
import * as session from "express-session";
import * as fs from "fs";

async function bootstrap() {

    const httpsOptions = {
        // key: fs.readFileSync('./cert/CA/key.pem', 'utf8'),
        // cert: fs.readFileSync('./cert/CA/server.crt', 'utf8'),
    };
    const app = await NestFactory.create<NestExpressApplication>(AppModule, {
        httpsOptions
    });

    const corsConfig: CorsOptions = {
        origin: process.env.CLIENT_URL,
        credentials: true,
        preftialightContinue: false
    };

    app.enableCors(corsConfig);

    app.use(
        session({
            name: "NEST_SESSION",
            secret: "sefkjb237",
            resave: false,
            saveUninitialized: false,
            cookie: {
                secure: true,
                httpOnly: true,
                sameSite: false
            }
        })
    );

    await app.listen(process.env.PORT || 3000);
}

bootstrap();
