pipeline {
  agent any

  stages {
    stage('Checkout') {
      steps { checkout scm }
    }

    stage('Install Dependencies') {
      steps {
        sh 'sudo apt-get update && sudo apt-get install -y jq cloc locales && sudo locale-gen en_US.UTF-8'
      }
    }

    stage('Run cloc') {
      steps {
        sh 'mkdir -p code-metrics && cloc . --json > code-metrics/cloc-output.json'
      }
    }

    stage('Print stats') {
      steps {
        sh '''
          OUTPUT=code-metrics/cloc-output.json
          TOTAL=$(jq '.SUM.code // 0' "$OUTPUT")
          format() { export LC_ALL="en_US.UTF-8"; printf "%'d\n" "$1"; }
          echo "====== Lines of Code Summary ======"
          jq -r 'to_entries[] | select(.key != "SUM") | [.key, .value.code // 0] | @tsv' "$OUTPUT" | sort -k1,1 | while IFS=$'\t' read lang count; do
            printf "%-20s : %s\n" "$lang" "$(format "$count")"
          done
          echo "-----------------------------------"
          echo "Total Lines          : $(format "$TOTAL")"
        '''
      }
    }
  }
}
