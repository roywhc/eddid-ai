#docker volume create n8n_data

docker run -it --rm --name n8n -p 5678:5678 -v n8n_data:/home/node/.n8n docker.n8n.io/n8nio/n8n

# docker run -it --rm --name n8n -p 5678:5678 -v C:/Users/Wanho/workspace/eddid-ai/n8n:/home/node docker.n8n.io/n8nio/n8n