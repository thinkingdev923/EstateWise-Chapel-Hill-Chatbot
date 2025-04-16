# Use an official slim Python image as the base image.
FROM python:3.9-slim

# Set the working directory inside the container.
WORKDIR /workspace

# Install any system dependencies (e.g. build tools) required for compiling Python packages.
RUN apt-get update && apt-get install -y build-essential && rm -rf /var/lib/apt/lists/*

# Copy requirements file and install Python packages.
# (Place requirements.txt at the root of your repository or adjust the COPY command accordingly.)
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Open a Bash shell by default.
CMD ["bash"]
