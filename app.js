import express from "express";
import logger from "morgan";
import cors from "cors";
import compression from "compression";
import helmet from "helmet";
import bodyParser from "body-parser";

const app = express();

app.use(compression());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(helmet());
app.disable("x-powered-by");
app.use(
  cors({
    origin: "*",
  })
);
app.use(express.json());
app.use(logger("dev"));
app.use(express.urlencoded({ extended: false }));

app.get("/", (_, res) => {
  res.send("WAK WAW");
});

export default app;
