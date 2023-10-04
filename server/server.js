import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import http from "http";
import newSonos from "./sonos.js";

const app = express();
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const apiHandler = (handler) => {
  return async (req, res) => {
    try {
      const ret = await handler(req);
      res.send(JSON.stringify(ret));
    } catch (error) {
      log.error(error);
      res.status(500).send('Server Error.');
    }
  };
};

const get = (relPath, handler) => app.get("/api" + relPath, apiHandler(handler));
const post = (relPath, handler) => app.post("/api" + relPath, apiHandler(handler));

const ctrl = await newSonos();

post("/volume/up",
  async ({ body: { host } }) => ctrl.changeVolumeBy(host, 1));
post("/volume/down",
  async ({ body: { host } }) => ctrl.changeVolumeBy(host, -1));
post("/volume/set",
  async ({ body: { host, value } }) => ctrl.setVolume(host, value));
post("/volume/change",
  async ({ body: { host, value } }) => ctrl.changeVolumeBy(host, value));
post("/volume/toggleMute",
  async ({ body: { host } }) => ctrl.toggleMute(host));
post("/volume/undo",
  async ({ body: { host } }) => ctrl.undo(host));

get("/device",
  async ({ query: { uuid } }) => ctrl.getDeviceFromUUID(uuid));
get("/devices",
  async ({ }) => ctrl.getDevices());

post("/device/next",
  async ({ body: { host } }) => ctrl.deviceNext(host));
post("/device/stop",
  async ({ body: { host } }) => ctrl.deviceStop(host));
post("/device/pause",
  async ({ body: { host } }) => ctrl.devicePause(host));
post("/device/play",
  async ({ body: { host } }) => ctrl.devicePlay(host));
post("/device/previous",
  async ({ body: { host } }) => ctrl.devicePrevious(host));
post("/device/tv",
  async ({ body: { host } }) => ctrl.deviceTV(host));

const server = http.createServer(app);
const port = process.env.PORT || 3001;

server.listen(port, () => {
  console.log("Server listening on http://localhost:%d", port);
});
