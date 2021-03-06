import { GraphQLServer } from "graphql-yoga";

import DomainName from "./graphql/scalar-domain-name";
import Ip from "./graphql/scalar-ip";
import Tasks from "./tasks";

import LOOKUP_METHODS from "./lookup-methods";

const typeDefs = `
  scalar DomainName
  scalar Ip
  scalar Lookup

  enum LookupMethod {
    ${LOOKUP_METHODS.join("\n")}
  }

  type Query {
    newIpLookup(ip: Ip!, methods: [LookupMethod]): Lookup!
    newDnLookup(dn: DomainName!, methods: [LookupMethod]): Lookup!
  }
`;

const resolvers = {
  DomainName,
  Ip,
  Query: {
    async newIpLookup(_, { ip, methods = LOOKUP_METHODS }) {
      const tasks = methods.map(m => [m, new Tasks[m]({ ip }).run()]);
      const result = {};
      for (const [method, taskPromise] of tasks) {
        result[method] = await taskPromise;
      }
      return result;
    },
    async newDnLookup(_, { dn, methods = LOOKUP_METHODS }) {
      const tasks = methods.map(m => [m, new Tasks[m]({ dn }).run()]);
      const result = {};
      for (const [method, taskPromise] of tasks) {
        result[method] = await taskPromise.catch(() => null);
      }
      return result;
    }
  }
};

const server = new GraphQLServer({ typeDefs, resolvers });
server.start(() => console.log("Server is running on localhost:4000"));
