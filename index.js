/**
 * @fileOverview VK Music transfer script from one account to another
 * There is api limitations with audio interaction
 * So this script require that Destination account has access to audio of origin account
 * Need to pass captcha during process: open url, read captcha, back to terminal, pass.
 * @author Vadim Melnikov <ratealt@gmail.com>
 */


const easyvk = require('easyvk');
const inquirer = require('inquirer');
const fs = require('fs');

const from_session = fs.existsSync(__dirname + '/.session-from') ? JSON.parse( fs.readFileSync(__dirname + '/.session-from')) : undefined;
const to_session = fs.existsSync(__dirname + '/.session-to') ? JSON.parse(fs.readFileSync(__dirname + '/.session-to')) : undefined;

function username(session) {
  if (session === undefined) return ''
  else return session.username;
}

function questions(session, type) {
  return [
    {
      type: 'confirm',
      name: 'overwrite',
      message: 'Session exists for: ' + username(session) + '. Overwrite?',
      when: () => session !== undefined,
    },
    {
      type: 'input',
      name: 'username',
      message: 'Enter ' + type + ' account username/login',
      when: (answers) => session !== undefined ? answers.overwrite : true, 
    },
    {
      type: 'input',
      name: 'password',
      message: 'Enter ' + type + ' account password',
      when: (answers) => session !== undefined ? answers.overwrite : true, 
    },
  ]
}

const defaultParams = {
  captchaHandler: captchaHandler,
  authType: easyvk.APPLICATION_AUTH_TYPE,
  api_v: '5.75',
  fields: [],
  utils: {},
  mode: 'highload',
  userAgent: "KateMobileAndroid/45 lite-421 (Android 5.0; SDK 21; armeabi-v7a; LENOVO Lenovo A1000; ru)"
}

async function createAuth(session, type, saveSession) {
  console.log('Provide data for ' + type + ' user');
  const answers = await inquirer.prompt(questions(session, type))

  const authData = !answers.overwrite && session !== undefined ? {
    access_token: session.access_token,
    ...defaultParams,
  } : {
    username: answers.username,
    password: answers.password,
    session_file: saveSession,
    save_session: true,
    ...defaultParams,
  }
  
  // TODO: Add OAuth in browser
  if (answers.overwrite || session === undefined) {
    console.warn('Authentication with username/password not supported right now');
    throw 500
  }

  return authData;
}

async function captchaHandler ({captcha_sid, captcha_img:url, resolve:solve}, error) {
  const { answer } = await inquirer.prompt([
    {
      type: 'input',
      name: 'answer',
      message: `Solve captcha: ${url}`
    }
  ])

  try {
    await solve(answer);
  } catch ({e, recall}) {
    console.error(e)
    recall()
  }
}

async function main() {
  var from, to;

  try {
    from = await easyvk(createAuth(from_session, 'origin', __dirname + '/.session-from'));
  } catch(e) {
    if (e === 500) return 500;
    console.error('Wrong credentials for origin account', e.message)
    return 1
  }
  console.log('Origin Client authorized')

  try {
    to = await easyvk(createAuth(to_session, 'destination', __dirname + '/.session-to'));
  } catch(e) {
    if (e === 500) return 500;
    console.error('Wrong credentials for destination account', e.message)
    return 1
  }
  console.log('Destination Client authorized')

  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      choices: [
        'Transfer music',
      ],
      filter: (value) => {
        return value.toLowerCase().split(' ')
      }
    }
  ])

  if (action[0] === 'transfer' && action[1] === 'music') {
    const { confirmation } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmation',
        message: 'Are you sure?',
      }
    ])
    if (confirmation) {
      try {
        const audioResponseToOrigin = await from.call('audio.get');
        const origin_id = audioResponseToOrigin.vkr.items[0].owner_id;
        const audioResponseToDestination = await to.call('audio.get', {
          owner_id: origin_id
        })
        for (let audio of audioResponseToDestination.vkr.items) {
          console.log('Processing ' + audio.artist + ' - ' + audio.title)
          let params = {}
          params.act = 'add'
          params.al = 1
          params.audio_id = audio.id
          params.owner_id = origin_id
          params.from = 'user_list'
          params.hash = audio.add_hash
          console.log(await to.call('audio.add', params))
        }
        console.log('Job complete')
      } catch(e) {
        console.error(e);
      }
    }
  }
}

main();