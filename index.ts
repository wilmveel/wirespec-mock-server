import fs from "fs";
import express, { Request, Response } from "express";
import {
  Nullable,
  OpenApiV3,
  WsContent,
  WsEndpoint,
  WsLiteral,
  WsParam,
  WsSegment,
} from "@flock/wirespec";

import { generator } from "./generator";

const openapi = fs.readFileSync("petstorev3.json");
const openApiParser = new OpenApiV3();
const ast = openApiParser.parse(String(openapi));
const { generateRandomContent } = generator(ast);

const app = express();

const handler =
  (content: Nullable<WsContent> | undefined | null) =>
  (_: Request, res: Response) => {
    if (content != undefined) {
      res.type(content.type);
      res.send(generateRandomContent(content));
    } else {
      res.end();
    }
  };

const createPath = (enpoint: WsEndpoint) => {
  return (
    "/" +
    enpoint.path
      .map((it: WsSegment) => {
        if (it instanceof WsLiteral) {
          return it.value;
        }
        if (it instanceof WsParam) {
          return `:${it.identifier.value}`;
        }
        throw new Error("Cannot map path");
      })
      .join("/")
  );
};

(ast.filter((it) => it instanceof WsEndpoint) as WsEndpoint[]).forEach(
  (it: WsEndpoint) => {
    const content = it.responses.filter(
      (it) => it?.content?.type === "application/json",
    )[0]?.content;
    switch (it.method.name) {
      case "GET":
        return app.get(createPath(it), handler(content));
      case "POST":
        return app.post(createPath(it), handler(content));
      case "PUT":
        return app.put(createPath(it), handler(content));
      case "DELETE":
        return app.delete(createPath(it), handler(content));
    }
    throw new Error("Cannot map method");
  },
);

app.listen(3000);
