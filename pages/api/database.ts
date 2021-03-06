import { MongoClient } from "mongodb";
import nextConnect from "next-connect";

const client = new MongoClient("mongodb+srv://yuanlin:411612@cluster0-9wzb6.gcp.mongodb.net/test?retryWrites=true&w=majority", {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

async function database(req: { dbClient: any; db: any; }, _res: any, next: () => any) {
    if (!client.isConnected()) await client.connect();
    req.dbClient = client;
    req.db = client.db("calendar");
    return next();
}

const middleware = nextConnect();

middleware.use(database);

export default middleware;
