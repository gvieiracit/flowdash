import { Configuration, OpenAIApi } from 'openai';
import { OpenAiClient } from '../OpenAi/OpenAiClient';
import { Status } from '../../util/Status';

// Pre-set base URL (hidden from UI)
// Using relative path to leverage webpack dev server proxy and avoid CORS issues
const FLOW_BASE_URL = '/flow-llm-proxy/v1';

const consoleLogAsync = async (message: string, other?: any) => {
  await new Promise((resolve) => setTimeout(resolve, 0)).then(() => console.info(message, other));
};

export class FlowClient extends OpenAiClient {
  provider: string | undefined;

  constructor(settings) {
    super(settings);
    this.provider = settings.provider;
  }

  /**
   * Function used to create the OpenAiApi object with Flow's base URL.
   */
  setModelClient() {
    const configuration = new Configuration({
      apiKey: this.apiKey,
      basePath: FLOW_BASE_URL,
    });
    this.modelClient = new OpenAIApi(configuration);
  }

  /**
   * Override setApiKey to also reconfigure the client with Flow's base URL.
   */
  setApiKey(apiKey) {
    this.apiKey = apiKey;
    const configuration = new Configuration({
      apiKey: apiKey,
      basePath: FLOW_BASE_URL,
    });
    this.modelClient = new OpenAIApi(configuration);
  }

  /**
   * Authenticate with the Flow LiteLLM Proxy.
   */
  async authenticate(
    setIsAuthenticated = () => {
      // console.log(boolean);
    }
  ) {
    try {
      let tmp = await this.getListModels();
      setIsAuthenticated(tmp.length > 0 ? Status.AUTHENTICATED : Status.ERROR);
      return tmp.length > 0;
    } catch (e) {
      consoleLogAsync('Authentication went wrong: ', e);
      return false;
    }
  }

  /**
   * Fetch available models from the Flow LiteLLM Proxy.
   * Uses direct fetch to avoid CORS/SDK issues with custom endpoints.
   * @returns list of models available for this client
   */
  async getListModels() {
    let res;
    try {
      consoleLogAsync('Fetching models from Flow:', `${FLOW_BASE_URL}/models`);
      consoleLogAsync('Using API Key (first 20 chars):', this.apiKey?.substring(0, 20));

      const response = await fetch(`${FLOW_BASE_URL}/models`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      consoleLogAsync('Flow response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        consoleLogAsync('Flow error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      consoleLogAsync('Flow models response:', data);

      // LiteLLM proxy returns OpenAI-compatible format: { data: [{ id: "model-name", ... }] }
      res = data.data ? data.data.map((x) => x.id) : [];
    } catch (e) {
      consoleLogAsync('Error while loading the model list from Flow: ', e);
      res = [];
    }
    this.setListAvailableModels(res);
    return res;
  }

  /**
   * Override chatCompletion to use Flow's endpoint.
   */
  async chatCompletion(history) {
    try {
      const response = await fetch(`${FLOW_BASE_URL}/chat/completions`, {
        method: 'POST',
        mode: 'cors',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.modelType,
          messages: history,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const completion = await response.json();
      if (completion.choices && completion.choices[0]?.message) {
        return completion.choices[0].message;
      }
      throw new Error(`Unexpected response format`);
    } catch (e) {
      consoleLogAsync('Error during chat completion: ', e);
      throw e;
    }
  }
}
