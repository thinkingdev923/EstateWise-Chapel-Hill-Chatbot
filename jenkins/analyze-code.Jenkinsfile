pipeline {
  agent any

  environment {
    GH_PAT = credentials('gh-pat')
  }

  stages {
    stage('Checkout') {
      steps { checkout scm }
    }

    stage('Install Dependencies') {
      steps {
        sh 'sudo apt-get update && sudo apt-get install -y jq cloc locales && sudo locale-gen en_US.UTF-8'
      }
    }

    stage('Validate Token') {
      steps {
        sh '''
          if [ -z "$GH_PAT" ]; then
            echo "GH_PAT is not configured" && exit 1
          fi
        '''
      }
    }

    stage('Fetch Repositories') {
      steps {
        sh '''
          RESPONSE=$(curl -sSL -H "Authorization: token $GH_PAT" \
            "https://api.github.com/user/repos?visibility=all&affiliation=owner&per_page=100")
          REPOS=$(echo "$RESPONSE" | jq -r '.[].full_name')
          mkdir -p all-repos && cd all-repos
          for REPO in $REPOS; do
            CLONE_URL="https://x-access-token:$GH_PAT@github.com/$REPO.git"
            DEFAULT_BRANCH=$(curl -sSL -H "Authorization: token $GH_PAT" \
              "https://api.github.com/repos/$REPO" | jq -r '.default_branch // "main"')
            git clone --depth 1 --branch "$DEFAULT_BRANCH" "$CLONE_URL" "$(basename $REPO)" || echo "Failed to clone $REPO"
          done
        '''
      }
    }

    stage('Calculate Lines of Code') {
      steps {
        sh 'cloc all-repos --json > cloc-output.json'
      }
    }

    stage('Print Stats') {
      steps {
        sh '''
          TOTAL=$(jq '.SUM.code // 0' cloc-output.json)
          JS=$(jq '.JavaScript.code // 0' cloc-output.json)
          HTML=$(jq '.HTML.code // 0' cloc-output.json)
          echo "====== Lines of Code Summary ======"
          echo "JavaScript       : $JS"
          echo "HTML             : $HTML"
          echo "Total Lines      : $TOTAL"
        '''
      }
    }
  }
}
