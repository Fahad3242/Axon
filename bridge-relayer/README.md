<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment to Railway

The Axon Bridge Relayer is pre-configured for automated deployment to **Railway** using the included `Dockerfile` and `railway.json` parameters.

### Deployment Steps

1. **Push to GitHub**: Push this repository (or your monorepo containing `bridge-relayer`) to your GitHub account.
2. **Create a Railway Project**:
   - Log in to the [Railway Dashboard](https://railway.app).
   - Click **New Project** &rarr; **Deploy from GitHub repo**.
   - Select your repository and select the `bridge-relayer` service/sub-directory if deploying a monorepo.
3. **Provision a PostgreSQL Database**:
   - Inside your Railway project, click **New** &rarr; **Database** &rarr; **Add PostgreSQL**.
   - Railway will automatically provision a PostgreSQL instance and inject the `DATABASE_URL` environment variable directly into your relayer service.
4. **Configure Environment Variables**:
   - Select your `bridge-relayer` service in the Railway canvas.
   - Go to **Variables** and add the required parameters (see the table below).
5. **Deploy**:
   - Railway will detect the `Dockerfile` and `railway.json`, compile the NestJS backend via the multi-stage docker compiler, run the health check at `/health`, and deploy the container.

---

### Required Environment Variables

| Variable | Description |
| :--- | :--- |
| `DATABASE_URL` | The PostgreSQL database connection URI (Automatically injected by Railway). |
| `SEPOLIA_HTTP_RPC` | HTTPS JSON-RPC endpoint for Sepolia testnet. |
| `SEPOLIA_WS_RPC` | WebSocket (WSS) JSON-RPC endpoint for Sepolia testnet. |
| `AMOY_HTTP_RPC` | HTTPS JSON-RPC endpoint for Polygon Amoy testnet. |
| `AMOY_WS_RPC` | WebSocket (WSS) JSON-RPC endpoint for Polygon Amoy testnet. |
| `BRIDGE_A_ADDRESS` | Address of the Bridge A contract on Sepolia (`0xd2c7926742AB4f6C6e8d64A7ad51870dDBd33cFE`). |
| `BRIDGE_B_ADDRESS` | Address of the Bridge B contract on Amoy (`0xF95A94AcbA872885E7BAb86a2B1520833Fb0C225`). |
| `RELAYER_PRIVATE_KEY` | Hex private key of the relayer account (to trigger minting on Amoy and release on Sepolia). |
| `PORT` | The network port NestJS listens on (Defaults to `3001` or auto-injected by Railway). |

---

### How to Get WebSocket (WSS) RPC URLs

The relayer relies on WebSockets (`wss://`) to listen for real-time contract events (`TokensLocked` on Sepolia and `TokensBurned` on Amoy).

1. **Sign Up for Alchemy or Infura**:
   - Go to [Alchemy](https://www.alchemy.com) or [Infura](https://www.infura.io) and create a free account.
2. **Create Apps**:
   - Create an app for **Ethereum Sepolia**.
   - Create another app for **Polygon Amoy**.
3. **Copy the API Endpoints**:
   - Click **API Key** or **View Key** inside your app dashboard.
   - You will see tabs for both **HTTPS** and **WebSockets (WS)**.
   - Copy the HTTPS link for `HTTP_RPC` variables.
   - Copy the `wss://` link for `WS_RPC` variables.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
