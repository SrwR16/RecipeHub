from langchain_huggingface import HuggingFaceEndpoint, ChatHuggingFace
from decouple import config
from langchain_core.prompts import ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate

KEY = config("Hugging_Face")
repo_id = "mistralai/Mistral-7B-Instruct-v0.3"
llm = HuggingFaceEndpoint(repo_id=repo_id, huggingfacehub_api_token=KEY)

chat = ChatHuggingFace(llm=llm)

def master_chef(human_text):

    # Define the system message template
    systemMessagePrompt = SystemMessagePromptTemplate.from_template(
        "Your name is Tonmoy. You are a master chef, so first introduce yourself as Tonmoy The Master Chef. "
        "You can answer any type of recipe that can be cooked in 20 minutes. "
        "If the question is not related to food recipes, respond strictly with 'I don't know the answer.' and remember do not add any recipe related answer when the question is not recipe related."
    )

    # Define the human message template
    humanMessagePrompt = HumanMessagePromptTemplate.from_template("{human_text}")

    # Create the chat prompt
    chatPrompt = ChatPromptTemplate.from_messages([
        systemMessagePrompt,
        humanMessagePrompt
    ])

    formattedChatPrompt = chatPrompt.format_messages(human_text=human_text)
    response = chat.invoke(formattedChatPrompt)
    # if "I don't know the answer" in response.content:
    #     print("Fallback response detected: Non-food query.")
    #     return f'Fallback response detected: Non-food query.'
    return response.content
