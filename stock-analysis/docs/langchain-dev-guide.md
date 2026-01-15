# LangChain 開發者指南

## 目錄

1. [簡介](#簡介)
2. [安裝與設定](#安裝與設定)
3. [核心概念](#核心概念)
4. [LangChain Expression Language (LCEL)](#langchain-expression-language-lcel)
5. [模型整合](#模型整合)
6. [提示工程](#提示工程)
7. [輸出解析器](#輸出解析器)
8. [檢索增強生成 (RAG)](#檢索增強生成-rag)
9. [代理與工具](#代理與工具)
10. [記憶體管理](#記憶體管理)
11. [向量儲存與嵌入](#向量儲存與嵌入)
12. [串流與非同步處理](#串流與非同步處理)
13. [快取策略](#快取策略)
14. [錯誤處理與重試](#錯誤處理與重試)
15. [監控與除錯](#監控與除錯)
16. [生產環境部署](#生產環境部署)
17. [安全性最佳實踐](#安全性最佳實踐)
18. [效能優化](#效能優化)

---

## 簡介

LangChain 是一個強大的開源框架，專為開發由大型語言模型 (LLM) 驅動的應用程式而設計。LangChain v1.0 於 2025 年發布，提供了生產就緒的基礎，具備以下核心改進：

- **create_agent**: 建構代理的新標準方法
- **標準內容區塊**: 統一存取跨提供者的現代 LLM 功能
- **簡化的套件結構**: 更清晰的模組化設計

### 主要特點

- **模型不可知性**: 支援 OpenAI、Anthropic、Google、AWS 等多個 LLM 提供者
- **可組合性**: 使用 LCEL 管道語法建構複雜的工作流程
- **生產就緒**: 長期支援 (LTS) 版本，採用語義版本控制
- **豐富的整合**: 數千個整合與工具
- **企業級功能**: 串流、快取、監控和可觀測性

### 版本資訊

- **LangChain 1.0** 和 **LangGraph 1.0** 為 LTS 版本
- 需要 **Python 3.10+**
- 遵循 N-2 支援政策（當前版本、N-1 為關鍵支援、N-2+ 為生命週期結束）
- 舊版（LangChain 0.3、LangGraph 0.4）在維護模式直到 2026 年 12 月

---

## 安裝與設定

### 系統需求

- Python 3.10 或更高版本
- pip 套件管理器
- 虛擬環境（建議）

### 基本安裝

```bash
# 建立並啟動虛擬環境
python -m venv langchain-env
source langchain-env/bin/activate  # Windows: langchain-env\Scripts\activate

# 安裝 LangChain 核心
pip install -U langchain

# 檢查版本
python -c "import langchain_core; print(langchain_core.__version__)"
```

### 提供者整合

LangChain 使用模組化設計，每個提供者都有獨立的套件：

```bash
# OpenAI 整合
pip install -U langchain-openai

# Anthropic (Claude) 整合
pip install -U langchain-anthropic

# Google 整合
pip install -U langchain-google-genai

# 社群整合
pip install -U langchain-community
```

### 環境變數設定

建立 `.env` 檔案來管理 API 金鑰：

```bash
# .env
OPENAI_API_KEY=sk-your-openai-key
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=your-langsmith-key
LANGCHAIN_PROJECT=your-project-name
```

使用 `python-dotenv` 載入環境變數：

```python
from dotenv import load_dotenv
load_dotenv()
```

### 驗證安裝

```python
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage

# 測試 LLM 連接
llm = ChatOpenAI(model="gpt-4")
response = llm.invoke([HumanMessage(content="Hello, LangChain!")])
print(response.content)
```

---

## 核心概念

### 元件架構

LangChain 將元件組織為幾個主要類別：

#### 1. 模型 (Models)
- **Chat Models**: 用於對話式 AI（ChatOpenAI、ChatAnthropic）
- **LLMs**: 傳統文字完成模型
- **Embedding Models**: 將文字轉換為向量表示

#### 2. 提示 (Prompts)
- **PromptTemplate**: 用於簡單字串提示
- **ChatPromptTemplate**: 用於結構化對話
- **MessagesPlaceholder**: 動態訊息注入

#### 3. 輸出解析器 (Output Parsers)
- **StrOutputParser**: 純文字輸出
- **JsonOutputParser**: 結構化 JSON 響應
- **PydanticOutputParser**: 型別安全的物件

#### 4. 檢索器 (Retrievers)
- **VectorStoreRetriever**: 從向量資料庫檢索
- **MultiQueryRetriever**: 多查詢檢索
- **ContextualCompressionRetriever**: 壓縮檢索結果

#### 5. 文件處理 (Document Processing)
- **Document Loaders**: PDF、CSV、HTML、網頁爬蟲等
- **Text Splitters**: 分塊策略
- **Transformers**: 文件轉換和增強

#### 6. 記憶體 (Memory)
- **ConversationBufferMemory**: 儲存完整對話
- **ConversationSummaryMemory**: 摘要式記憶體
- **ConversationBufferWindowMemory**: 滑動視窗記憶體

#### 7. 代理 (Agents)
- **create_agent**: 生產級代理實現
- **Tools**: 可擴展的外部能力
- **Middleware**: 自訂行為注入

---

## LangChain Expression Language (LCEL)

LCEL 是建構鏈的推薦方法，使用管道運算子 `|` 來組合元件。

### 基本語法

```python
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI
from langchain_core.output_parsers import StrOutputParser

# 定義元件
prompt = ChatPromptTemplate.from_template("請用一句話解釋 {topic}")
model = ChatOpenAI(model="gpt-4")
output_parser = StrOutputParser()

# 使用管道語法組合
chain = prompt | model | output_parser

# 執行
result = chain.invoke({"topic": "量子計算"})
print(result)
```

### 管道運算子原理

管道運算子 `|` 使用 Python 的 `__or__` 方法實現：

```python
# 概念性實現
class Runnable:
    def __or__(self, other):
        def chained_func(*args, **kwargs):
            return other.invoke(self.func(*args, **kwargs))
        return Runnable(chained_func)
    
    def invoke(self, *args, **kwargs):
        return self.func(*args, **kwargs)
```

### LCEL 介面

LCEL 提供統一的介面方法：

#### 同步方法

```python
# invoke: 處理單一輸入
result = chain.invoke({"topic": "機器學習"})

# batch: 批次處理多個輸入
results = chain.batch([
    {"topic": "深度學習"},
    {"topic": "自然語言處理"},
    {"topic": "電腦視覺"}
])

# stream: 串流輸出
for chunk in chain.stream({"topic": "生成式 AI"}):
    print(chunk, end="", flush=True)
```

#### 非同步方法

```python
import asyncio

async def async_example():
    # ainvoke: 非同步單一輸入
    result = await chain.ainvoke({"topic": "強化學習"})
    
    # abatch: 非同步批次處理
    results = await chain.abatch([
        {"topic": "遷移學習"},
        {"topic": "聯邦學習"}
    ])
    
    # astream: 非同步串流
    async for chunk in chain.astream({"topic": "多模態 AI"}):
        print(chunk, end="", flush=True)

asyncio.run(async_example())
```

### RunnableParallel 與 RunnablePassthrough

```python
from langchain_core.runnables import RunnableParallel, RunnablePassthrough

# 並行執行多個鏈
parallel_chain = RunnableParallel({
    "summary": summary_chain,
    "sentiment": sentiment_chain,
    "keywords": keyword_chain
})

# 使用 RunnablePassthrough 傳遞原始輸入
chain_with_context = RunnableParallel({
    "context": RunnablePassthrough(),
    "answer": qa_chain
})
```

### LCEL 優勢

- **串流支援**: 開箱即用的串流功能
- **非同步執行**: 原生 async/await 支援
- **並行處理**: 輕鬆實現並行工作流程
- **重試與容錯**: 內建錯誤處理
- **可觀測性**: 與 LangSmith 無縫整合

---

## 模型整合

### Chat Models

#### OpenAI

```python
from langchain_openai import ChatOpenAI

# 基本設定
llm = ChatOpenAI(
    model="gpt-4",
    temperature=0.7,
    max_tokens=1000,
    timeout=30,
    max_retries=2
)

# 使用訊息
from langchain_core.messages import HumanMessage, SystemMessage

messages = [
    SystemMessage(content="你是一位專業的 Python 開發者"),
    HumanMessage(content="請解釋裝飾器的概念")
]

response = llm.invoke(messages)
print(response.content)
```

#### Anthropic (Claude)

```python
from langchain_anthropic import ChatAnthropic

llm = ChatAnthropic(
    model="claude-3-opus-20240229",
    temperature=0.0,
    max_tokens=2000
)

# Claude 支援系統提示
response = llm.invoke([
    SystemMessage(content="你是一位 AI 助手，專注於清晰且準確的回答"),
    HumanMessage(content="解釋遷移學習")
])
```

#### Google (Gemini)

```python
from langchain_google_genai import ChatGoogleGenerativeAI

llm = ChatGoogleGenerativeAI(
    model="gemini-pro",
    temperature=0.5,
    convert_system_message_to_human=True
)
```

### 模型功能

#### 結構化輸出

```python
from pydantic import BaseModel, Field

class PersonInfo(BaseModel):
    name: str = Field(description="人物姓名")
    age: int = Field(description="人物年齡")
    occupation: str = Field(description="職業")

# 使用 with_structured_output
structured_llm = llm.with_structured_output(PersonInfo)

result = structured_llm.invoke("分析這段文字：張三是一位 30 歲的軟體工程師")
print(f"姓名: {result.name}, 年齡: {result.age}, 職業: {result.occupation}")
```

#### 工具呼叫

```python
from langchain_core.tools import tool

@tool
def calculate_area(length: float, width: float) -> float:
    """計算矩形面積"""
    return length * width

# 綁定工具到模型
llm_with_tools = llm.bind_tools([calculate_area])

response = llm_with_tools.invoke("計算長 5 公尺、寬 3 公尺的矩形面積")
```

---

## 提示工程

### PromptTemplate

```python
from langchain_core.prompts import PromptTemplate

# 基本範本
prompt = PromptTemplate.from_template(
    "撰寫一篇關於 {topic} 的 {length} 文章"
)

# 格式化
formatted = prompt.format(topic="人工智慧", length="簡短")
print(formatted)
```

### ChatPromptTemplate

```python
from langchain_core.prompts import ChatPromptTemplate

# 從訊息建立
prompt = ChatPromptTemplate.from_messages([
    ("system", "你是一位資深的 {role}"),
    ("human", "請回答: {question}")
])

# 使用
chain = prompt | llm | StrOutputParser()
response = chain.invoke({
    "role": "資料科學家",
    "question": "什麼是過擬合？"
})
```

### MessagesPlaceholder

```python
from langchain_core.prompts import MessagesPlaceholder

prompt = ChatPromptTemplate.from_messages([
    ("system", "你是一位有幫助的助手"),
    MessagesPlaceholder("chat_history"),  # 動態插入對話歷史
    ("human", "{input}")
])
```

### Few-Shot Prompting

```python
from langchain_core.prompts import FewShotPromptTemplate

examples = [
    {
        "input": "2 + 2",
        "output": "4"
    },
    {
        "input": "5 * 3",
        "output": "15"
    }
]

example_prompt = PromptTemplate(
    input_variables=["input", "output"],
    template="輸入: {input}\n輸出: {output}"
)

few_shot_prompt = FewShotPromptTemplate(
    examples=examples,
    example_prompt=example_prompt,
    suffix="輸入: {input}\n輸出:",
    input_variables=["input"]
)
```

### 提示最佳實踐

1. **明確且具體**: 提供清晰的指示和上下文
2. **使用分隔符**: 使用 `"""` 或 `---` 分隔不同部分
3. **指定輸出格式**: 明確說明期望的輸出結構
4. **提供範例**: 使用 few-shot 學習提高準確性
5. **角色定義**: 為助手分配特定角色和專業知識

---

## 輸出解析器

### StrOutputParser

```python
from langchain_core.output_parsers import StrOutputParser

parser = StrOutputParser()
chain = prompt | llm | parser

# 返回純字串
result = chain.invoke({"topic": "區塊鏈"})
```

### JsonOutputParser

```python
from langchain_core.output_parsers import JsonOutputParser
from pydantic import BaseModel, Field

class Recipe(BaseModel):
    name: str = Field(description="食譜名稱")
    ingredients: list[str] = Field(description="所需材料清單")
    steps: list[str] = Field(description="烹飪步驟")

parser = JsonOutputParser(pydantic_object=Recipe)

prompt = ChatPromptTemplate.from_messages([
    ("system", "你是一位廚師。{format_instructions}"),
    ("human", "提供 {dish} 的食譜")
])

chain = prompt.partial(
    format_instructions=parser.get_format_instructions()
) | llm | parser

result = chain.invoke({"dish": "番茄炒蛋"})
print(result)  # 字典格式
```

### StructuredOutputParser

```python
from langchain.output_parsers import ResponseSchema, StructuredOutputParser

response_schemas = [
    ResponseSchema(name="answer", description="問題的答案"),
    ResponseSchema(name="source", description="資訊來源"),
    ResponseSchema(name="confidence", description="信心程度 (0-1)")
]

parser = StructuredOutputParser.from_response_schemas(response_schemas)

prompt = PromptTemplate(
    template="回答問題。\n{format_instructions}\n問題: {question}",
    input_variables=["question"],
    partial_variables={"format_instructions": parser.get_format_instructions()}
)

chain = prompt | llm | parser
result = chain.invoke({"question": "Python 什麼時候發布？"})
```

### PydanticOutputParser

```python
from langchain_core.output_parsers import PydanticOutputParser
from typing import List

class Article(BaseModel):
    title: str
    author: str
    summary: str
    keywords: List[str]

parser = PydanticOutputParser(pydantic_object=Article)

prompt = ChatPromptTemplate.from_template(
    "分析以下文章：\n{text}\n\n{format_instructions}"
)

chain = prompt.partial(
    format_instructions=parser.get_format_instructions()
) | llm | parser

# 返回 Article 物件
article = chain.invoke({"text": "文章內容..."})
print(article.title)
```

### 輸出修正解析器

處理格式錯誤的輸出：

```python
from langchain.output_parsers import OutputFixingParser

# 包裝現有解析器
fixing_parser = OutputFixingParser.from_llm(
    parser=parser,
    llm=llm
)

# 自動修正錯誤
result = fixing_parser.parse(potentially_malformed_output)
```

---

## 檢索增強生成 (RAG)

RAG 將檢索機制與生成模型結合，透過外部知識增強 LLM 響應。

### RAG 管道步驟

1. **文件載入與分塊**
2. **生成嵌入並建構向量儲存**
3. **配置檢索管道**
4. **結合上下文與 LLM 生成**

### 完整 RAG 實現

#### 1. 文件載入與分塊

```python
from langchain_community.document_loaders import (
    PyPDFLoader,
    TextLoader,
    WebBaseLoader
)
from langchain.text_splitters import RecursiveCharacterTextSplitter

# 載入文件
loader = PyPDFLoader("document.pdf")
documents = loader.load()

# 分塊
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200,
    length_function=len,
    separators=["\n\n", "\n", " ", ""]
)

chunks = text_splitter.split_documents(documents)
```

#### 2. 建構向量儲存

```python
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import FAISS, Chroma

# 建立嵌入
embeddings = OpenAIEmbeddings(model="text-embedding-3-small")

# FAISS 向量儲存
vectorstore = FAISS.from_documents(
    documents=chunks,
    embedding=embeddings
)

# 或 Chroma
vectorstore = Chroma.from_documents(
    documents=chunks,
    embedding=embeddings,
    persist_directory="./chroma_db"
)
```

#### 3. 建立檢索器

```python
# 基本檢索器
retriever = vectorstore.as_retriever(
    search_type="similarity",
    search_kwargs={"k": 4}
)

# 最大邊際相關性 (MMR) 檢索
retriever = vectorstore.as_retriever(
    search_type="mmr",
    search_kwargs={"k": 4, "fetch_k": 20}
)
```

#### 4. RAG 鏈

```python
from langchain_core.runnables import RunnablePassthrough
from langchain_core.prompts import ChatPromptTemplate

# RAG 提示
template = """使用以下上下文回答問題：

上下文:
{context}

問題: {question}

請提供詳細且準確的答案。如果上下文中沒有答案，請說明。
"""

prompt = ChatPromptTemplate.from_template(template)

# 格式化文件的輔助函數
def format_docs(docs):
    return "\n\n".join(doc.page_content for doc in docs)

# RAG 鏈
rag_chain = (
    {
        "context": retriever | format_docs,
        "question": RunnablePassthrough()
    }
    | prompt
    | llm
    | StrOutputParser()
)

# 使用
response = rag_chain.invoke("LangChain 是什麼？")
print(response)
```

### RAG 進階技術

#### 多查詢檢索

```python
from langchain.retrievers.multi_query import MultiQueryRetriever

multi_query_retriever = MultiQueryRetriever.from_llm(
    retriever=vectorstore.as_retriever(),
    llm=llm
)
```

#### 上下文壓縮

```python
from langchain.retrievers import ContextualCompressionRetriever
from langchain.retrievers.document_compressors import LLMChainExtractor

compressor = LLMChainExtractor.from_llm(llm)

compression_retriever = ContextualCompressionRetriever(
    base_compressor=compressor,
    base_retriever=vectorstore.as_retriever()
)
```

#### 帶來源的 RAG

```python
from langchain.chains import RetrievalQAWithSourcesChain

qa_chain = RetrievalQAWithSourcesChain.from_chain_type(
    llm=llm,
    chain_type="stuff",
    retriever=retriever,
    return_source_documents=True
)

result = qa_chain.invoke({"question": "你的問題"})
print(f"答案: {result['answer']}")
print(f"來源: {result['source_documents']}")
```

---

## 代理與工具

代理使用 LLM 進行推理並決定採取哪些行動來達成目標。

### 使用 create_agent (v1.0)

```python
from langchain_openai import ChatOpenAI
from langchain.agents import create_agent
from langchain_core.tools import tool

# 定義工具
@tool
def search_database(query: str) -> str:
    """在資料庫中搜尋資訊"""
    # 實現搜尋邏輯
    return f"搜尋結果: {query}"

@tool
def calculate(expression: str) -> float:
    """評估數學表達式"""
    return eval(expression)

# 建立代理
tools = [search_database, calculate]

agent = create_agent(
    model=ChatOpenAI(model="gpt-4"),
    tools=tools
)

# 執行
result = agent.invoke({"input": "在資料庫中搜尋客戶資料，然後計算 150 * 1.2"})
print(result)
```

### 自訂工具

```python
from langchain_core.tools import BaseTool
from typing import Optional
from pydantic import Field

class CustomSearchTool(BaseTool):
    name: str = "custom_search"
    description: str = "在自訂資料庫中搜尋"
    api_key: str = Field(exclude=True)  # 私有欄位
    
    def _run(self, query: str) -> str:
        """同步執行"""
        # 實現搜尋邏輯
        return f"結果 for: {query}"
    
    async def _arun(self, query: str) -> str:
        """非同步執行"""
        return self._run(query)
```

### ReAct 代理

```python
from langchain.agents import create_react_agent, AgentExecutor
from langchain import hub

# 從 hub 拉取 ReAct 提示
prompt = hub.pull("hwchase17/react")

# 建立代理
agent = create_react_agent(
    llm=llm,
    tools=tools,
    prompt=prompt
)

# 建立執行器
agent_executor = AgentExecutor(
    agent=agent,
    tools=tools,
    verbose=True,
    max_iterations=10,
    handle_parsing_errors=True
)

# 執行
response = agent_executor.invoke({
    "input": "查詢今天的天氣，然後建議適合的活動"
})
```

### 帶檢索的代理

```python
from langchain.tools.retriever import create_retriever_tool

retriever_tool = create_retriever_tool(
    retriever,
    "knowledge_base",
    "搜尋公司知識庫以獲取相關資訊"
)

tools = [retriever_tool, calculate, search_database]

agent_executor = create_agent(
    model=llm,
    tools=tools
)
```

### 中介軟體

```python
from typing import TypedDict
from langgraph.types import StreamWriter

class State(TypedDict):
    messages: list
    context: str

# 檢索中介軟體
def retrieve_documents_middleware(state: State):
    """在模型呼叫前注入檢索文件"""
    last_message = state["messages"][-1]
    retrieved_docs = vectorstore.similarity_search(last_message.text)
    
    docs_content = "\n\n".join(doc.page_content for doc in retrieved_docs)
    
    augmented_message_content = (
        f"{last_message.text}\n\n"
        "使用以下上下文:\n"
        f"{docs_content}"
    )
    
    return {
        "messages": [last_message.model_copy(
            update={"content": augmented_message_content}
        )],
        "context": retrieved_docs
    }

agent = create_agent(
    model=llm,
    tools=[],
    middleware=[retrieve_documents_middleware]
)
```

---

## 記憶體管理

記憶體讓代理和鏈能夠記住之前的互動。

### ConversationBufferMemory

```python
from langchain.memory import ConversationBufferMemory
from langchain.chains import ConversationChain

memory = ConversationBufferMemory()

conversation = ConversationChain(
    llm=llm,
    memory=memory,
    verbose=True
)

# 對話
response1 = conversation.invoke("你好，我叫小明")
response2 = conversation.invoke("我的名字是什麼？")  # 記得之前的對話
```

### ConversationBufferWindowMemory

```python
from langchain.memory import ConversationBufferWindowMemory

# 只保留最後 k 次互動
memory = ConversationBufferWindowMemory(k=3)

conversation = ConversationChain(
    llm=llm,
    memory=memory
)
```

### ConversationSummaryMemory

```python
from langchain.memory import ConversationSummaryMemory

# 使用 LLM 摘要對話
memory = ConversationSummaryMemory(llm=llm)

conversation = ConversationChain(
    llm=llm,
    memory=memory
)
```

### 使用 RunnableWithMessageHistory (現代方法)

```python
from langchain_core.runnables.history import RunnableWithMessageHistory
from langchain_core.chat_history import InMemoryChatMessageHistory

# 儲存管理
store = {}

def get_session_history(session_id: str):
    if session_id not in store:
        store[session_id] = InMemoryChatMessageHistory()
    return store[session_id]

# 包裝鏈
chain_with_history = RunnableWithMessageHistory(
    chain,
    get_session_history,
    input_messages_key="input",
    history_messages_key="chat_history"
)

# 使用
response = chain_with_history.invoke(
    {"input": "你好"},
    config={"configurable": {"session_id": "user123"}}
)
```

### 持久化記憶體

```python
from langchain.memory import PostgresChatMessageHistory

# PostgreSQL 後端
history = PostgresChatMessageHistory(
    connection_string="postgresql://user:pass@localhost/dbname",
    session_id="user123"
)

# 或 Redis
from langchain.memory import RedisChatMessageHistory

history = RedisChatMessageHistory(
    url="redis://localhost:6379",
    session_id="user123"
)
```

---

## 向量儲存與嵌入

### 嵌入模型

```python
from langchain_openai import OpenAIEmbeddings
from langchain_community.embeddings import HuggingFaceEmbeddings

# OpenAI 嵌入
embeddings = OpenAIEmbeddings(
    model="text-embedding-3-small"
)

# Hugging Face 嵌入
embeddings = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2"
)

# 生成嵌入
text = "這是一個範例文字"
embedding_vector = embeddings.embed_query(text)
```

### FAISS

```python
from langchain_community.vectorstores import FAISS

# 建立
vectorstore = FAISS.from_documents(
    documents=chunks,
    embedding=embeddings
)

# 儲存到磁碟
vectorstore.save_local("./faiss_index")

# 從磁碟載入
loaded_vectorstore = FAISS.load_local(
    "./faiss_index",
    embeddings,
    allow_dangerous_deserialization=True
)

# 搜尋
results = vectorstore.similarity_search("查詢", k=4)
```

### Chroma

```python
from langchain_community.vectorstores import Chroma

# 建立並持久化
vectorstore = Chroma.from_documents(
    documents=chunks,
    embedding=embeddings,
    persist_directory="./chroma_db"
)

# 載入現有
vectorstore = Chroma(
    persist_directory="./chroma_db",
    embedding_function=embeddings
)
```

### Pinecone

```python
from langchain_pinecone import PineconeVectorStore
import pinecone

# 初始化 Pinecone
pinecone.init(
    api_key="your-api-key",
    environment="us-west1-gcp"
)

# 建立索引
vectorstore = PineconeVectorStore.from_documents(
    documents=chunks,
    embedding=embeddings,
    index_name="my-index"
)
```

### 向量儲存比較

| 特性 | FAISS | Chroma | Pinecone |
|------|-------|--------|----------|
| 類型 | 本地 | 本地/雲端 | 雲端 |
| 擴展性 | 中等 | 中等 | 高 |
| 持久化 | 檔案系統 | 檔案系統 | 雲端 |
| 成本 | 免費 | 免費 | 付費 |
| 設定複雜度 | 低 | 低 | 中等 |

---

## 串流與非同步處理

### 基本串流

```python
# 同步串流
for chunk in llm.stream("撰寫一個關於 AI 的故事"):
    print(chunk.content, end="", flush=True)

# 使用鏈串流
for chunk in chain.stream({"topic": "機器學習"}):
    print(chunk, end="", flush=True)
```

### 非同步串流

```python
import asyncio

async def async_stream_example():
    async for chunk in llm.astream("解釋量子計算"):
        print(chunk.content, end="", flush=True)

asyncio.run(async_stream_example())
```

### 批次處理

```python
# 同步批次
inputs = [
    {"topic": "Python"},
    {"topic": "JavaScript"},
    {"topic": "Rust"}
]

results = chain.batch(inputs)

# 控制並發
results = chain.batch(inputs, config={"max_concurrency": 3})
```

### 非同步批次

```python
async def async_batch_example():
    inputs = [{"topic": f"主題 {i}"} for i in range(10)]
    results = await chain.abatch(inputs)
    return results

results = asyncio.run(async_batch_example())
```

### 使用 StreamWriter 的自訂串流

```python
from langgraph.types import StreamWriter
from typing import TypedDict

class State(TypedDict):
    topic: str
    output: str

async def generate_content(state: State, writer: StreamWriter):
    """帶自訂串流的非同步節點"""
    topic = state["topic"]
    
    # 串流中間步驟
    await writer("開始生成...\n")
    
    async for chunk in llm.astream(f"撰寫關於 {topic} 的文章"):
        await writer(chunk.content)
    
    return {"output": "完成"}
```

### FastAPI 中的串流

```python
from fastapi import FastAPI
from fastapi.responses import StreamingResponse

app = FastAPI()

@app.post("/stream")
async def stream_response(query: str):
    async def generate():
        async for chunk in chain.astream({"input": query}):
            yield f"data: {chunk}\n\n"
    
    return StreamingResponse(
        generate(),
        media_type="text/event-stream"
    )
```

---

## 快取策略

### Redis 快取

```python
from langchain.cache import RedisCache
from langchain.globals import set_llm_cache
import redis

# 設定 Redis 快取
redis_client = redis.Redis(
    host="localhost",
    port=6379,
    db=0
)

set_llm_cache(RedisCache(redis_client))

# 第一次呼叫（未快取）
response1 = llm.invoke("什麼是快取？")

# 第二次呼叫（已快取，更快）
response2 = llm.invoke("什麼是快取？")
```

### Redis 語意快取

```python
from langchain_redis import RedisSemanticCache
from langchain_openai import OpenAIEmbeddings

embeddings = OpenAIEmbeddings()

semantic_cache = RedisSemanticCache(
    redis_url="redis://localhost:6379",
    embeddings=embeddings,
    distance_threshold=0.2
)

set_llm_cache(semantic_cache)

# 原始查詢
response1 = llm.invoke("法國的首都是什麼？")

# 語意相似查詢（已快取）
response2 = llm.invoke("請告訴我法國的首都城市")
```

### 記憶體快取

```python
from langchain.cache import InMemoryCache

set_llm_cache(InMemoryCache())
```

### 帶 TTL 的快取

```python
from langchain_redis import RedisCache

# 60 秒 TTL
cache = RedisCache(
    redis_url="redis://localhost:6379",
    ttl=60
)

set_llm_cache(cache)
```

### 快取最佳實踐

1. **開發環境**: 使用記憶體快取進行快速測試
2. **生產環境**: 使用 Redis 進行分散式快取
3. **語意快取**: 用於相似查詢的使用者面向應用
4. **TTL 設定**: 根據資料新鮮度需求設定適當的 TTL
5. **快取失效**: 實現資料更新時的快取清除策略

---

## 錯誤處理與重試

### 內建重試

```python
from langchain_openai import ChatOpenAI

llm = ChatOpenAI(
    model="gpt-4",
    max_retries=3,  # 失敗時重試 3 次
    timeout=30  # 30 秒超時
)
```

### 使用 Runnable.with_retry

```python
from langchain_core.runnables import RunnableConfig

# 為鏈添加重試
chain_with_retry = chain.with_retry(
    stop_after_attempt=3,
    wait_exponential_jitter=True
)

# 使用
result = chain_with_retry.invoke({"input": "查詢"})
```

### Try-Except 錯誤處理

```python
from langchain_core.exceptions import OutputParserException
from openai.error import RateLimitError, APIError

try:
    result = chain.invoke({"input": "問題"})
except RateLimitError as e:
    print(f"超出速率限制: {e}")
    # 實現退避策略
    time.sleep(60)
    result = chain.invoke({"input": "問題"})
except OutputParserException as e:
    print(f"解析錯誤: {e}")
    # 使用 OutputFixingParser
    fixing_parser = OutputFixingParser.from_llm(parser=parser, llm=llm)
    result = fixing_parser.parse(e.llm_output)
except APIError as e:
    print(f"API 錯誤: {e}")
    # 記錄並重試
```

### 自訂重試邏輯

```python
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type
)

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=4, max=10),
    retry=retry_if_exception_type(RateLimitError)
)
def call_llm_with_retry(prompt):
    return llm.invoke(prompt)
```

### 容錯 (Fallbacks)

```python
from langchain_core.runnables import RunnableWithFallbacks

# 主要模型
primary_llm = ChatOpenAI(model="gpt-4")

# 備用模型
fallback_llm = ChatOpenAI(model="gpt-3.5-turbo")

# 建立帶容錯的鏈
chain_with_fallback = primary_llm.with_fallbacks([fallback_llm])

# 如果 GPT-4 失敗，自動使用 GPT-3.5
result = chain_with_fallback.invoke("問題")
```

### 代理中的錯誤處理

```python
from langchain.agents import AgentExecutor

agent_executor = AgentExecutor(
    agent=agent,
    tools=tools,
    verbose=True,
    max_iterations=10,
    handle_parsing_errors=True,  # 處理解析錯誤
    return_intermediate_steps=True
)

try:
    result = agent_executor.invoke({"input": "複雜任務"})
except Exception as e:
    print(f"代理執行失敗: {e}")
    # 記錄中間步驟進行除錯
    if hasattr(e, 'intermediate_steps'):
        print("中間步驟:", e.intermediate_steps)
```

---

## 監控與除錯

### LangSmith 追蹤

```python
import os

# 啟用 LangSmith 追蹤
os.environ["LANGCHAIN_TRACING_V2"] = "true"
os.environ["LANGCHAIN_API_KEY"] = "your-langsmith-api-key"
os.environ["LANGCHAIN_PROJECT"] = "your-project-name"

# 所有鏈和代理將自動追蹤
chain = prompt | llm | parser
result = chain.invoke({"input": "問題"})

# 在 LangSmith UI 中查看追蹤
```

### 自訂回調處理器

```python
from langchain_core.callbacks import BaseCallbackHandler

class CustomCallbackHandler(BaseCallbackHandler):
    """用於記錄執行指標的自訂回調"""
    
    def __init__(self):
        self.llm_calls = 0
        self.total_tokens = 0
        self.errors = []
    
    def on_llm_start(self, serialized, prompts, **kwargs):
        self.llm_calls += 1
        print(f"LLM 呼叫 #{self.llm_calls} 開始")
    
    def on_llm_end(self, response, **kwargs):
        if hasattr(response, 'llm_output'):
            token_usage = response.llm_output.get('token_usage', {})
            tokens = token_usage.get('total_tokens', 0)
            self.total_tokens += tokens
            print(f"使用 {tokens} tokens (總計: {self.total_tokens})")
    
    def on_llm_error(self, error, **kwargs):
        self.errors.append(str(error))
        print(f"LLM 錯誤: {error}")
    
    def on_chain_start(self, serialized, inputs, **kwargs):
        print(f"鏈開始: {serialized.get('name', 'Unknown')}")
    
    def on_chain_end(self, outputs, **kwargs):
        print("鏈結束")

# 使用自訂回調
handler = CustomCallbackHandler()
chain = prompt | llm | parser

result = chain.invoke(
    {"input": "問題"},
    config={"callbacks": [handler]}
)

print(f"總 LLM 呼叫: {handler.llm_calls}")
print(f"總 tokens: {handler.total_tokens}")
```

### 使用 get_openai_callback 追蹤成本

```python
from langchain_community.callbacks import get_openai_callback

with get_openai_callback() as cb:
    result1 = chain.invoke({"input": "問題 1"})
    result2 = chain.invoke({"input": "問題 2"})
    
    print(f"總 tokens: {cb.total_tokens}")
    print(f"提示 tokens: {cb.prompt_tokens}")
    print(f"完成 tokens: {cb.completion_tokens}")
    print(f"總成本: ${cb.total_cost}")
    print(f"成功請求: {cb.successful_requests}")
```

### 串流回調

```python
from langchain_core.callbacks.streaming_stdout import StreamingStdOutCallbackHandler

# 即時串流輸出
handler = StreamingStdOutCallbackHandler()

llm = ChatOpenAI(
    model="gpt-4",
    streaming=True,
    callbacks=[handler]
)

response = llm.invoke("撰寫一個故事")
```

### 詳細除錯

```python
# 啟用詳細記錄
import langchain

langchain.debug = True

# 執行鏈 - 查看詳細日誌
result = chain.invoke({"input": "問題"})

# 關閉除錯
langchain.debug = False
```

---

## 生產環境部署

### Docker 容器化

```dockerfile
# Dockerfile
FROM python:3.11-slim

WORKDIR /app

# 安裝依賴
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 複製應用程式
COPY . .

# 環境變數
ENV PYTHONUNBUFFERED=1

# 執行應用程式
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "8000:8000"
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - LANGCHAIN_API_KEY=${LANGCHAIN_API_KEY}
      - REDIS_URL=redis://redis:6379
    depends_on:
      - redis
  
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
```

### LangServe 部署

```python
from fastapi import FastAPI
from langserve import add_routes

app = FastAPI(
    title="LangChain API",
    version="1.0",
    description="LangChain 應用程式的 REST API"
)

# 添加鏈為路由
add_routes(
    app,
    chain,
    path="/chain",
    enabled_endpoints=["invoke", "batch", "stream"]
)

# 健康檢查
@app.get("/health")
async def health():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

### Kubernetes 部署

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: langchain-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: langchain
  template:
    metadata:
      labels:
        app: langchain
    spec:
      containers:
      - name: app
        image: your-registry/langchain-app:latest
        ports:
        - containerPort: 8000
        env:
        - name: OPENAI_API_KEY
          valueFrom:
            secretKeyRef:
              name: api-keys
              key: openai-key
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
```

### 環境管理

```python
# config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    openai_api_key: str
    anthropic_api_key: str
    langchain_api_key: str
    redis_url: str = "redis://localhost:6379"
    environment: str = "production"
    
    class Config:
        env_file = ".env"

settings = Settings()
```

### 監控與記錄

```python
import logging
from prometheus_client import Counter, Histogram

# 設定記錄
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Prometheus 指標
request_counter = Counter(
    'langchain_requests_total',
    'LangChain 請求總數',
    ['endpoint', 'status']
)

request_duration = Histogram(
    'langchain_request_duration_seconds',
    'LangChain 請求持續時間'
)

# 在端點中使用
@app.post("/query")
async def query(request: QueryRequest):
    with request_duration.time():
        try:
            result = chain.invoke({"input": request.query})
            request_counter.labels(endpoint='query', status='success').inc()
            return {"result": result}
        except Exception as e:
            logger.error(f"查詢失敗: {e}")
            request_counter.labels(endpoint='query', status='error').inc()
            raise
```

---

## 安全性最佳實踐

### API 金鑰管理

```python
# 使用環境變數
import os
from dotenv import load_dotenv

load_dotenv()

# 從不在程式碼中硬編碼金鑰
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")

# 使用 secrets 管理器（生產環境）
from azure.keyvault.secrets import SecretClient
from azure.identity import DefaultAzureCredential

credential = DefaultAzureCredential()
client = SecretClient(vault_url="https://your-vault.vault.azure.net/", credential=credential)

openai_key = client.get_secret("openai-api-key").value
```

### 輸入驗證

```python
from pydantic import BaseModel, Field, validator

class QueryRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=1000)
    session_id: str = Field(..., regex=r'^[a-zA-Z0-9_-]+$')
    
    @validator('query')
    def validate_query(cls, v):
        # 防止注入攻擊
        prohibited = ['<script>', 'DROP TABLE', 'exec(']
        if any(p in v.lower() for p in prohibited):
            raise ValueError("檢測到惡意輸入")
        return v

@app.post("/query")
async def query(request: QueryRequest):
    # 請求已驗證
    result = chain.invoke({"input": request.query})
    return {"result": result}
```

### 速率限制

```python
from fastapi import FastAPI, HTTPException
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)
app = FastAPI()
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.post("/query")
@limiter.limit("10/minute")
async def query(request: Request, query_request: QueryRequest):
    result = chain.invoke({"input": query_request.query})
    return {"result": result}
```

### 輸出過濾

```python
import re

def sanitize_output(text: str) -> str:
    """從輸出中移除敏感資訊"""
    # 移除電子郵件
    text = re.sub(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', '[EMAIL]', text)
    
    # 移除電話號碼
    text = re.sub(r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b', '[PHONE]', text)
    
    # 移除信用卡號碼
    text = re.sub(r'\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b', '[CARD]', text)
    
    return text

# 在鏈中使用
def safe_chain_invoke(input_data):
    result = chain.invoke(input_data)
    return sanitize_output(result)
```

### 存取控制

```python
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer()

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    # 驗證 JWT token
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        return payload
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="無效的認證憑證"
        )

@app.post("/query")
async def query(
    request: QueryRequest,
    user: dict = Depends(verify_token)
):
    # 使用者已認證
    result = chain.invoke({"input": request.query})
    return {"result": result}
```

---

## 效能優化

### 批次處理

```python
# 不推薦：逐一處理
results = []
for item in items:
    result = chain.invoke({"input": item})
    results.append(result)

# 推薦：批次處理
results = chain.batch([{"input": item} for item in items])

# 控制並發
results = chain.batch(
    [{"input": item} for item in items],
    config={"max_concurrency": 5}
)
```

### 快取

```python
# 使用 Redis 快取避免重複的 LLM 呼叫
from langchain.cache import RedisCache
from langchain.globals import set_llm_cache

set_llm_cache(RedisCache(redis_client))
```

### 連接池

```python
# 對資料庫連接使用連接池
from sqlalchemy import create_engine
from sqlalchemy.pool import QueuePool

engine = create_engine(
    "postgresql://user:pass@localhost/db",
    poolclass=QueuePool,
    pool_size=10,
    max_overflow=20
)
```

### 非同步處理

```python
# 對獨立任務使用非同步
async def process_multiple_queries(queries):
    tasks = [chain.ainvoke({"input": q}) for q in queries]
    results = await asyncio.gather(*tasks)
    return results
```

### 減少 Token 使用

```python
# 使用 ConversationSummaryMemory 而非 ConversationBufferMemory
from langchain.memory import ConversationSummaryMemory

memory = ConversationSummaryMemory(llm=llm)

# 使用較小的模型進行簡單任務
simple_llm = ChatOpenAI(model="gpt-3.5-turbo")
complex_llm = ChatOpenAI(model="gpt-4")

# 根據任務複雜度路由
def route_to_model(query):
    if is_simple_query(query):
        return simple_llm.invoke(query)
    else:
        return complex_llm.invoke(query)
```

### 載入平衡

```python
# 在 Kubernetes 中使用水平 Pod 自動擴展
# hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: langchain-app-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: langchain-app
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

---

## 附錄

### 常用命令參考

```bash
# 安裝
pip install -U langchain langchain-openai langchain-anthropic

# 升級到最新版本
pip install -U langchain langchain-core

# 檢查版本
python -c "import langchain_core; print(langchain_core.__version__)"

# 啟用除錯
export LANGCHAIN_DEBUG=true

# 啟用 LangSmith 追蹤
export LANGCHAIN_TRACING_V2=true
export LANGCHAIN_API_KEY=your-key
```

### 有用的資源

- **官方文件**: https://docs.langchain.com
- **API 參考**: https://api.python.langchain.com
- **LangSmith**: https://smith.langchain.com
- **GitHub**: https://github.com/langchain-ai/langchain
- **Discord 社群**: https://discord.gg/langchain

### 疑難排解

#### 依賴衝突
```bash
# 建立乾淨的虛擬環境
python -m venv fresh-env
source fresh-env/bin/activate
pip install langchain langchain-openai
```

#### API 錯誤
```python
# 檢查 API 金鑰
import os
print(os.getenv("OPENAI_API_KEY"))  # 應不為 None

# 測試連接
from langchain_openai import ChatOpenAI
llm = ChatOpenAI(model="gpt-3.5-turbo")
response = llm.invoke("測試")
```

#### 記憶體問題
```python
# 對大型文件使用串流
for chunk in chain.stream(large_input):
    process_chunk(chunk)

# 使用生成器
def process_documents():
    for doc in document_loader.lazy_load():
        yield process(doc)
```

---

## 結論

本指南涵蓋了使用 LangChain 開發生產級 LLM 應用程式的基本概念。主要要點：

1. **從簡單開始**: 使用 LCEL 快速原型化
2. **模組化設計**: 利用 LangChain 的可組合架構
3. **生產就緒**: 實現正確的錯誤處理、監控和安全性
4. **效能優化**: 使用快取、批次處理和非同步操作
5. **持續學習**: LangChain 快速發展，保持更新

隨著您建構更複雜的應用程式，請參考官方文件以獲取最新功能和最佳實踐。

---

**版本**: LangChain 1.0+  
**最後更新**: 2026 年 1 月  
**作者**: LangChain 開發者社群
