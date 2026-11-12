import csv, json, random
from itertools import permutations


def read_common_words(input_common_words, index_common_words):
    words = []
    with open(input_common_words, "r") as f:
        myreader = csv.reader(f, delimiter=',')
        for row in myreader:
            words.append(row[index_common_words])

    return words


data = []
def generate_numbers_fo_korean(file, type):
    with open('Korean/NativeKoreanNumbers1_100.csv') as f:
        words = read_common_words('Korean/common_words_korean.csv', 1)
        numbers_data = []
        reader = csv.reader(f)
        for r in reader:
            numbers_data.append({'numeric': r[0], 'written': r[1], 'pronunciation': r[2]})

        # data = []
        cnt_g = 0
        perm = list(permutations([0, 1, 2, 3]))
        for a in numbers_data:
            ind = [i, j, k] = random.sample(range(0, len(numbers_data) - 1), 3)
            cnt = 0
            answer = 0
            choices = []
            for i in perm[random.randint(0, len(perm) - 1)]:
                if i == 3:
                    choices.append(a['numeric'])
                    answer = cnt
                else:
                    choices.append(numbers_data[ind[i]]['numeric'])
                cnt = cnt + 1
            data.append({
                "question": a['written'],
                "choices": choices,
                "answer": answer,
                "type": 'numbers',
                "intent": "",
                "extra": 'Write the following number in numerals (' + type + "):"
            })
            cnt_g = cnt_g + 1

        for a in numbers_data:
            ind = [i, j, k] = random.sample(range(0, len(numbers_data) - 1), 3)
            cnt = 0
            answer = 0
            choices = []
            for i in perm[random.randint(0, len(perm) - 1)]:
                if i == 3:
                    choices.append(a['written'])
                    answer = cnt
                else:
                    choices.append(numbers_data[ind[i]]['written'])
                cnt = cnt + 1
            data.append({
                "question": a['numeric'],
                "choices": choices,
                "answer": answer,
                "type": 'numbers',
                "intent": "",
                "extra": 'Write the following number in letters (' + type + '):'
            })
            cnt_g = cnt_g + 1

        for a in numbers_data:
            ind = [i, j, k] = random.sample(range(0, len(numbers_data) - 1), 3)
            cnt = 0
            answer = 0
            choices = []
            for i in perm[random.randint(0, len(perm) - 1)]:
                if i == 3:
                    choices.append(a['pronunciation'])
                    answer = cnt
                else:
                    choices.append(numbers_data[ind[i]]['pronunciation'])
                cnt = cnt + 1
            data.append({
                "question": a['written'],
                "choices": choices,
                "answer": answer,
                "type": 'numbers',
                "intent": "",
                "extra": 'What is the pronunciation of (' + type + ')'
            })
            cnt_g = cnt_g + 1

            with open('Korean/Numbers.json', 'w') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)

        for a in numbers_data:
            ind = [i, j, k] = random.sample(range(0, len(numbers_data) - 1), 3)
            cnt = 0
            answer = 0
            choices = []
            for i in perm[random.randint(0, len(perm) - 1)]:
                if i == 3:
                    choices.append(a['pronunciation'])
                    answer = cnt
                else:
                    choices.append(numbers_data[ind[i]]['pronunciation'])
                cnt = cnt + 1
            data.append({
                "question": a['numeric'],
                "choices": choices,
                "answer": answer,
                "type": 'numbers',
                "intent": "",
                "extra": 'What is the pronunciation of (' + type + ')'
            })
            cnt_g = cnt_g + 1



generate_numbers_fo_korean('Korean/SinoKoreanNumbers1_100.csv', 'Sino-Korean')
generate_numbers_fo_korean('Korean/NativeKoreanNumbers1_100.csv', 'Native')

with open('Korean/Numbers.json', 'w') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)