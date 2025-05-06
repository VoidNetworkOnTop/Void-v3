import { createBareServer } from '@tomphttp/bare-server-node';
import express from 'express';
import http from 'node:http';
import path from "node:path";
const app = express();
const bare = createBareServer("/bare/");
const server = http.createServer();
const dirname = process.cwd();
const PORT = 8080;
app.use(express.static("img")) // IMGS GET PROIRITY BI
app.get("/ga", function (req, res) {
  res.sendFile(path.join(dirname, "static/games.html"));
})
app.get("/rga", function(req, res) {
res.sendFile(path.join(dirname, "static/rga.html"))
})
app.get("/learn", function (req, res) {
  res.sendFile(path.join(dirname, "static/proxy.html"));
})
app.get("/app", function (req, res) {
  res.sendFile(path.join(dirname, "static/apps.html"));
})
app.get("/credits", function (req, res) {
  res.sendFile(path.join(dirname, "static/credits.html"));
})
app.get("/voidurls", function (req, res) {
  res.sendFile(path.join(dirname, "static/voidurls.html"));
})
app.get("/settings", function (req, res) {
  res.sendFile(path.join(dirname, "static/settings.html"));
})
app.get("/chat", function (req, res) {
  res.sendFile(path.join(dirname, "static/chat.html"));
})
app.get("/voidgpt", function (req, res) {
  res.sendFile(path.join(dirname, "static/voidgpt.html"));
})
app.use(express.static(path.join(dirname, "static")));
app.get('*', function(req, res) {res.sendFile(path.join(dirname, "static/404.html"))})
server.on("request", (req, res) => {
if (bare.shouldRoute(req)) {bare.routeRequest(req, res)} else {app(req, res)}})
server.listen({port: PORT, host: '0.0.0.0'}, () => {console.log("listening on port " + PORT + " (IPv4 and IPv6)")})
