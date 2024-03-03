
function install(express){
	express.get('/localAI', (req,res)=>res.send('ciao!'));
	express.get( '/localAI/message',
						(req, res) => {
							 sendMessage(req.params['input'], req.params['temperature']?parseFloat(req.params['temperature']):0.7 ,(data,error,params)=>error?res.send(error):res.json(data));
						}
					);
	express.get( '/localAI/rephrase',
						(req, res) => {
							 rephrase(req.params['input'], req.params['temperature']?parseFloat(req.params['temperature']):0.7 ,(data,error,params)=>error?res.send(error):res.json(data));
						}
					);
	express.get( '/localAI/prompt',
						(req, res) => {
							 prompt(req.params['input'], req.params['temperature']?parseFloat(req.params['temperature']):0.7 ,(data,error,params)=>error?res.send(error):res.json(data));
						}
					);
	express.get( '/localAI/models',
						(req, res) => {
							 getModels((data,error)=>error?res.send(error):res.json(data));
						}
					);
}

const port=8081;
export const host='http://localhost';
export const version='v1';


const apiUrl=host+':'+port+'/'+version+'/';
import axios from 'axios';
export async function getModels(callback){
	try {
    const response = await axios.post(apiUrl+'models',  {
      headers: {
        'Content-Type': 'application/json',
      },
    });
	callback(response,null,[]);
    console.log('LocalAI:', response.data);
  } catch (error) {
    console.error('LocalAI: API Error:', error.message);
    callback(null,error,[]);
  }
}

/**
 * @prototype {string}
 */
export async function sendMessage(this_message, temperature ,callback) {
  const requestData = {
    model: 'ggml-koala-7b-model-q4_0-r2.bin',
    messages: [
      {
        role: 'user',
        content: this_message,
      },
    ],
    temperature: temperature,
  };

  try {
    const response = await axios.post(apiUrl+'chat/completions', requestData, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
	callback(response,null,requestData);
    console.log('LocalAI:', response.data);
  } catch (error) {
    console.error('LocalAI: API Error:', error.message);
    callback(null,error,requestData);
  }
}

/**
 * @prototype {string}
 */
export async function rephrase(this_message, temperature ,callback) {
  const requestData = {
    model: 'ggml-koala-7b-model-q4_0-r2.bin',
    instruction: "rephrase",
    input:this_message,
    temperature: temperature,
  };

  try {
    const response = await axios.post(apiUrl+'edits', requestData, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
	callback(response,null,requestData);
    console.log('LocalAI:', response.data);
  } catch (error) {
    console.error('LocalAI: API Error:', error.message);
    callback(null,error,requestData);
  }
}

/**
 * @prototype {string}
 */
export async function prompt(this_message, temperature ,callback) {
  const requestData = {
    model: 'ggml-koala-7b-model-q4_0-r2.bin',
    prompt:this_message,
    temperature: temperature,
  };

  try {
    const response = await axios.post(apiUrl+'completions', requestData, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
	callback(response,null,requestData);
    console.log('LocalAI:', response.data);
  } catch (error) {
    console.error('LocalAI: API Error:', error.message);
    callback(null,error,requestData);
  }
}

 