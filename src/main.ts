import {NestFactory} from "@nestjs/core";
import {AppModule} from "./app.module";
import {NestExpressApplication} from "@nestjs/platform-express";
import {CorsOptions} from "cors";
import * as session from "express-session";
import {ConfigService} from "@nestjs/config";

async function bootstrap() {


    const httpsOptions = {
        // key: fs.readFileSync(__dirname + '\\cert\\CA\\key.pem', 'utf8'),
        // cert: fs.readFileSync(__dirname + '\\cert\\CA\\server.crt', 'utf8'),
    };
    const app = await NestFactory.create<NestExpressApplication>(AppModule, {
        httpsOptions
    });

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

    await app.listen(configService.get('port') || 3000);
}

bootstrap();
