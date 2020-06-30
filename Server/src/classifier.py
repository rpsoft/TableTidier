import pandas
from sklearn import model_selection
from sklearn.linear_model import SGDClassifier
import pickle
import sys
import json

sgd = pickle.load(open("/home/suso/ihw/tableAnnotator/Server/src/sgd_multiterm.sav", 'rb'))
#
# def classify(terms){
#     return sgd.predict(terms)
# }



def main():
    while True:
        command = sys.stdin.readline()
        command = command.split('\n')[0]

        res = sgd.predict([command])
        # sys.stdout.write(command+" - "+res[0])
        sys.stdout.write("hello")
        #
        #
        # if command == "hello":
        #     # res =
        #     sys.stdout.write("You said hello!\n")
        #     # sys.stdout.write(res[0])
        # elif command == "goodbye":
        #     sys.stdout.write("You said goodbye!\n")
        # else:
        #     sys.stdout.write("Sorry, I didn't understand that.\n")
        sys.stdout.flush()

if __name__ == '__main__':
    main()
