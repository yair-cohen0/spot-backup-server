import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { NestExpressApplication } from "@nestjs/platform-express";
import { CorsOptions } from "cors";
import * as session from "express-session";
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

async function bootstrap() {

    const httpsOptions = {
        // key: fs.readFileSync('./cert/CA/key.pem', 'utf8'),
        // cert: fs.readFileSync('./cert/CA/server.crt', 'utf8'),
    };

    const firebaseConfig = {
        apiKey: "AIzaSyAk7Cx-V-9DC0_yY4MrFH_rjAWVhfHSgIc",
        authDomain: "spotify-backup-server.firebaseapp.com",
        projectId: "spotify-backup-server",
        storageBucket: "spotify-backup-server.appspot.com",
        messagingSenderId: "802860327592",
        appId: "1:802860327592:web:3ac7c5b3da8e0b77e5589d",
        measurementId: "G-NGBLVL1JMP"
    };




    const app = await NestFactory.create<NestExpressApplication>(AppModule);

    const firebaseApp = initializeApp(firebaseConfig);
    const analytics = getAnalytics(firebaseApp);


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
