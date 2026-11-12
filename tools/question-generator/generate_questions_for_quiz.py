import csv, json, random
from itertools import permutations


def generate_questions_for_quiz(input, output, type1, type2, extra1, extra2):
    dict_ko_en = {}
    dict_en_ko = {}
    words_en = []
    words_ko = []

    with open(input) as f:
        reader = csv.reader(f, delimiter=',')
        for row in reader:
            dict_ko_en[row[1]] = row[2]
            dict_en_ko[row[2]] = row[1]
            words_ko.append(row[1])
            words_en.append(row[2])

        data = []
        cnt_g = 0
        perm = list(permutations([0, 1, 2, 3]))
        for a in words_ko:
            ind = [i, j, k] = random.sample(range(0, len(words_en) - 1), 3)
            cnt = 0
            answer = 0
            choices = []
            for i in perm[random.randint(0, len(perm) - 1)]:
                if i == 3:
                    choices.append(dict_ko_en[a])
                    answer = cnt
                else:
                    choices.append(words_en[ind[i]])
                cnt = cnt + 1
            data.append({
                "question": a,
                "choices": choices,
                "answer": answer,
                "type": type1,
                "intent": "",
                "extra": extra1
            })
            cnt_g = cnt_g + 1

        for a in words_en:
            ind = [i, j, k] = random.sample(range(0, len(words_ko) - 1), 3)
            cnt = 0
            answer = 0
            choices = []
            for i in perm[random.randint(0, len(perm) - 1)]:
                if i == 3:
                    choices.append(dict_en_ko[a])
                    answer = cnt
                else:
                    choices.append(words_ko[ind[i]])
                cnt = cnt + 1
            data.append({
                "question": a,
                "choices": choices,
                "answer": answer,
                "type": type2,
                "intent": "",
                "extra": extra2
            })
            cnt_g = cnt_g + 1

        with open(output, 'w') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)


generate_questions_for_quiz('Korean/common_words_korean.csv', 'Korean/CommonWords.json', 'translation', 'translation',
                            'The translation of', 'The translation of')

generate_questions_for_quiz('Spanish/common_words_spanish.csv', 'Spanish/CommonWords.json', 'translation',
                            'translation','The translation of', 'The translation of')

generate_questions_for_quiz('German/common_words_german.csv', 'German/CommonWords.json', 'translation',
                            'translation','The translation of', 'The translation of')
