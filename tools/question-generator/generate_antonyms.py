import csv, json, random
from itertools import permutations


def read_common_words(input_common_words, index_common_words):
    words = []
    with open(input_common_words, "r") as f:
        reader = csv.reader(f, delimiter=',')
        for row in reader:
            words.append(row[index_common_words])

    return words


def generate_antonyms_for_quiz(input, output, type1, type2, extra1, extra2, input_common_words, index_common_words):
    words = read_common_words(input_common_words, index_common_words)
    arr_w = []
    arr_ant_w = []

    with open(input, "r") as f:
        reader = csv.reader(f, delimiter=',')
        for row in reader:
            arr_w.append(row[0])
            arr_ant_w.append(row[2])

        data = []
        cnt_g = 0
        perm = list(permutations([0, 1, 2, 3]))
        for a in arr_w:
            ind = [i, j, k] = random.sample(range(0, len(words) - 1), 3)
            cnt = 0
            answer = 0
            choices = []
            for i in perm[random.randint(0, len(perm) - 1)]:
                if i == 3:
                    choices.append(arr_ant_w[cnt_g])
                    answer = cnt
                else:
                    # print(ind)
                    choices.append(words[ind[i]])
                cnt = cnt + 1
            data.append({
                "question": a,
                "choices": choices,
                "answer": answer,
                "type": "antonym",
                "intent": "",
                "extra": "Antonym of"
            })
            cnt_g = cnt_g + 1

        cnt_g = 0
        for a in arr_ant_w:
            ind = [i, j, k] = random.sample(range(0, len(words) - 1), 3)
            cnt = 0
            answer = 0
            choices = []
            for i in perm[random.randint(0, len(perm) - 1)]:
                if i == 3:
                    choices.append(arr_w[cnt_g])
                    answer = cnt
                else:
                    choices.append(words[ind[i]])
                cnt = cnt + 1
            data.append({
                "question": a,
                "choices": choices,
                "answer": answer,
                "type": "antonym",
                "intent": "",
                "extra": "Antonym of"
            })
            cnt_g = cnt_g + 1

        with open(output, 'w') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)


generate_antonyms_for_quiz('German/antonyms.csv', 'German/Antonyms.json', 'antonyms', 'antonyms',
                           'Antonym of', 'Antonym of', 'German/common_words_german.csv', 1)

generate_antonyms_for_quiz('Spanish/antonyms.csv', 'Spanish/Antonyms.json', 'antonyms', 'antonyms',
                           'Antonym of', 'Antonym of', 'Spanish/common_words_spanish.csv', 1)

generate_antonyms_for_quiz('Korean/antonyms.csv', 'Korean/Antonyms.json', 'antonyms', 'antonyms',
                           'Antonym of', 'Antonym of', 'Korean/common_words_korean.csv', 1)
