/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "solana-blockmeter",
      home: "aws",
      providers: {
        aws: {
          region: "ap-southeast-1"
        }
      }
    };
  },
  async run() {
    const vpc = new sst.aws.Vpc("solana-blockmeter-vpc", {bastion: true});
    const cluster = new sst.aws.Cluster("solana-blockmeter-cluster", { vpc });
    const postgres = new sst.aws.Postgres("solana-blockmeter-postgres", { vpc });
    const redis = new sst.aws.Redis("solana-blockmeter-redis", { vpc });
  
    
    const api = new sst.aws.Service("solana-blockmeter-api", {  
      cluster,  
      link: [postgres, redis],  
      image: {  
        context: "./apps/api",  
        dockerfile: "Dockerfile"  // This is required  
      },  
      loadBalancer: {  
        rules: [  
          { listen: "80/http", forward: "3000/http" }  
        ]  
      },  
      dev: {  
        command: "pnpm run start:dev"  
      }  
    });

    const nextjs = new sst.aws.Nextjs("solana-blockmeter-web", {  
      path: "./apps/web",  
      link: [api],
      dev: {
        command: "pnpm run dev"
      }
    });  

    const DATABASE_URL = $interpolate`postgresql://${postgres.username}:${postgres.password}@${postgres.host}:${postgres.port}/${postgres.database}`;  
  
    new sst.x.DevCommand("Prisma", {  
      link: [postgres],  
      environment: { DATABASE_URL },  
      dev: {  
        autostart: false,  
        command: "npx prisma studio --schema=./apps/api/prisma/schema.prisma",  
      },  
    });

    return {
      api: api.url,
      nextjs: nextjs.url,
    }
  },
});
