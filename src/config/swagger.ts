import path from "path";
import * as yaml from "yamljs";

const swaggerDocument = yaml.load(path.join(__dirname, "../docs/openapi.yaml"));

export default swaggerDocument;
