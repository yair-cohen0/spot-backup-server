import {NestFactory} from "@nestjs/core";
import {AppModule} from "./app.module";
import {NestExpressApplication} from "@nestjs/platform-express";
import {CorsOptions} from "cors";
import * as session from "express-session";
import {ConfigService} from "@nestjs/config";
import * as fs from "fs";
import * as process from "process";

async function bootstrap() {


    const httpsOptions = {
        key: fs.readFileSync('.\\cert\\cert.key', 'utf8'),
        cert: fs.readFileSync('.\\cert\\cert.crt', 'utf8'),
    };

    let app = undefined;
    if (process.env.NODE_ENV === 'development')
        app = await NestFactory.create<NestExpressApplication>(AppModule, {httpsOptions});
    else
        app = await NestFactory.create<NestExpressApplication>(AppModule);

    const configService = app.get(ConfigService);

    const corsConfig: CorsOptions = {
        origin: configService.get('client_url'),
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

    await app.listen(configService.get('port') || 8080);
}

bootstrap();
