## VK Music Transfer [NodeJS]

 VK Music transfer script from one account to another. There is api limitations with audio interaction. So this script require that **destination** account has access to audio of **origin** account. 

## Project Status

This project is incomplete. It works, but UX sucks. So there is such problems we have:

- Infinite captcha manual solving during transferring. Possible workarounds?:
  - Super automatic captcha solver
  - Web UI with captcha solving by user inside one window? There is not so many captchas. About 30-50 requests between triggering captcha.
- Currently auth by login and password not working due to limitations of api. What to do?:
  - OAuth in browser by link, but not now
  
## Installation and Setup Instructions

You will need `node` and `npm` installed globally on your machine.  

### Clone repo

`git clone https://github.com/rIIh/vk-music-transfer.git`

`cd vk-music-transfer`

### Install deps

`npm i`

### Configure

Obtain Access Tokens anywhere in internet for both accounts and place them in separate files `.session-from` (Origin Account) and `.session-to` (Destination Account) as json with format: 

`
{
  "access_token":"<TOKEN_HERE>",
  "username":"<LOGIN_HERE>",
}
`

### Run script

`npm start`


## Reflection

My friend asked me could I write script for her to help with migrating from one account to other. So, this was easy.