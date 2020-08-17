#!/bin/sh

files="-1"

for entry in `ls -F|grep '/$'`; do
    if [ $entry = "test/" ]
    then
        echo "ignore directory $entry"
    else
        if [ $files = "-1" ];
        then
            files="./${entry}..."
        else
            files="$files,./${entry}..."
        fi
    fi
done


go test ./test/suites/... -coverpkg ${files} -coverprofile=cover.out 

go tool cover -html=./cover.out -o cover.html


# go test ./test/suites/components/pipeline/ -coverpkg ./components/pipeline/,./phases/... -coverprofile=cover.out 

# go tool cover -html=./cover.out -o cover.html