import * as process from "process";

export default () => ({
    client_url: process.env.CLIENT_URL,
    port: process.env.PORT,
    env: process.env.NODE_ENV
});
