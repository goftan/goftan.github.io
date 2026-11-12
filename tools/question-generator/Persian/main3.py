import csv
import json
import random
import re
from itertools import permutations

words = []
words_english = []

dict_en_fa = {}
dict_fa_en = {}

with open("dict.csv") as f:
    reader = csv.reader(f, delimiter=',')
    for row in reader:
        dict_en_fa[row[1]] = row[0]
        dict_fa_en[row[0]] = row[1]

with open("persian-wikipedia.csv") as f:
    reader = csv.reader(f, delimiter=',')
    for row in reader:
        if int(row[1]) > 2000:
            if len(row[0]) == 1 and row[0] != "و":
                continue
            words.append(row[0])
            if row[0] in dict_en_fa.keys():
                words_english.append(dict_en_fa[row[0]])

arr_w = []
arr_ant_w = []
arr_w_e = []
arr_ant_w_e = []

with open("antonyms.csv", "r") as f:
    reader = csv.reader(f, delimiter=',')
    for row in reader:
        arr_w.append(row[0])
        arr_ant_w.append(row[2])
        arr_w_e.append(row[1])
        arr_ant_w_e.append(row[3])
        words_english.append(row[1])
        words_english.append(row[3])
        dict_en_fa[row[1]] = row[0]
        dict_en_fa[row[3]] = row[2]
        dict_fa_en[row[0]] = row[1]
        dict_fa_en[row[2]] = row[3]

data = []
perm = list(permutations([0, 1, 2, 3]))
with open("../words_questions.json", "w") as f2:
    for w in words:
        if w in dict_en_fa.keys():
            ind = [i, j, k] = random.sample(range(0, len(words) - 1), 3)
            choices = []
            d = {}
            cnt = 0
            answer = 0
            for i in perm[random.randint(0, len(perm) - 1)]:
                if i == 3:
                    choices.append(w)
                    answer = cnt
                else:
                    choices.append(words[ind[i]])
                cnt = cnt + 1
            data.append({
                "question": dict_en_fa[w],
                "choices": choices,
                "answer": answer,
                "type": "translate_fa_en",
                "intent": "",
                "extra": "Translation of"
            })

    for w in words_english:
        if w in dict_fa_en.keys():
            ind = [i, j, k] = random.sample(range(0, len(words_english) - 1), 3)
            choices = []
            d = {}
            cnt = 0
            answer = 0
            lp = list(perm)[0]
            for i in perm[random.randint(0, len(perm) - 1)]:
                if i == 3:
                    choices.append(w)
                    answer = cnt
                else:
                    choices.append(words_english[ind[i]])
                cnt = cnt + 1

            data.append({
                "question": dict_fa_en[w],
                "choices": choices,
                "answer": answer,
                "type": "translate_en_fa",
                "intent": "",
                "extra": "Translation of"
            })

    # random.shuffle(data)
    # data = data[0:400]
    with open('CommonWords.json', 'w') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    data = []
    cnt_g = 0
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
    with open('Antonyms.json', 'w') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    data = []
    with open("amazon_fa.csv", "r") as f:
        reader = csv.reader(f)
        for r in reader:
            ind = [i, j, k] = random.sample(range(0, len(words) - 1), 3)
            cnt = 0
            answer = 0
            choices = []
            cnt_g = 0

            sentence_annot = r[2]
            # sentence = re.sub("\[[^]]*\]", lambda x: x.group(0).replace(',', ''), Variable)
            # sentence = re.sub(r"\[[^]]*\]", "-", sentence)
            sentence_annot_found = re.findall("\[[^]]*\]", sentence_annot)
            res = []
            for entity in sentence_annot_found:
                res.append(entity[entity.index(':') + 1:-1].strip())
            # print(res)
            # sentence = re.sub("\[[^]]*\]", lambda x: x.group(0), sentence)
            # print(sentence_annot
            if len(res) > 0:
                for i in perm[random.randint(0, len(perm) - 1)]:
                    if i == 3:
                        choices.append(res[0])
                        answer = cnt
                    else:
                        choices.append(words[ind[i]])
                    cnt = cnt + 1
                data.append({
                    "question": r[1].replace(res[0], "------"),
                    "choices": choices,
                    "answer": answer,
                    "type": "sentence",
                    "intent": r[0][r[0].index('_') + 1:],
                    "extra": "Fill in the blank"
                })
                if len(data) == 501:
                    break
                cnt_g = cnt_g + 1
    with open('CommonSentences.json', 'w') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    data = []
    capitals = []
    countries = []
    capital_country = {}
    country_capital = {}
    with open('capital_persian.csv') as f:
        reader = csv.reader(f, delimiter=',')
        for r in reader:
            cnt = 0
            answer = 0
            cnt_g = 0
            capitals.append(r[1])
            countries.append(r[0])
            capital_country[r[1]] = r[0]
            country_capital[r[0]] = r[1]

        for capital in capitals:
            choices = []
            ind = [i, j, k] = random.sample(range(0, len(countries) - 1), 3)
            cnt = 0
            for i in perm[random.randint(0, len(perm) - 1)]:
                if i == 3:
                    choices.append(capital_country[capital])
                    answer = cnt
                else:
                    choices.append(countries[ind[i]])
                cnt = cnt + 1

            data.append({
                "question": capital,
                "choices": choices,
                "answer": answer,
                "type": "sentence",
                "intent": "",
                "extra": "The country with the following capital:"
            })
            # data.append([capital, capital_country[capital], countries[i], countries[j], countries[k], "capital_country",
            #              "The country with the following capital:", ""])

        for country in countries:
            choices = []
            ind = [i, j, k] = random.sample(range(0, len(capitals) - 1), 3)
            cnt = 0
            for i in perm[random.randint(0, len(perm) - 1)]:
                if i == 3:
                    choices.append(country_capital[country])
                    answer = cnt
                else:
                    choices.append(capitals[ind[i]])
                cnt = cnt + 1

            data.append({
                "question": country,
                "choices": choices,
                "answer": answer,
                "type": "capital",
                "intent": "",
                "extra": "The capital of:"
            })

        with open('Capitals.json', 'w') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

    colors = []
    colors_en = []
    data = []
    with open('colors.csv') as f:
        reader = csv.reader(f, delimiter=',')
        for r in reader:
            colors.append(r[0])
            colors_en.append(r[2])

        cnt_g = 0
        for c in colors:
            choices = []
            ind = [i, j, k] = random.sample(range(0, len(colors_en) - 1), 3)
            cnt = 0
            for i in perm[random.randint(0, len(perm) - 1)]:
                if i == 3:
                    choices.append(colors_en[cnt_g])
                    answer = cnt
                else:
                    choices.append(colors_en[ind[i]])
                cnt = cnt + 1

            data.append({
                "question": c,
                "choices": choices,
                "answer": answer,
                "type": "color",
                "intent": "",
                "extra": "The translation of"
            })
            cnt_g = cnt_g + 1


        cnt_g = 0
        for c in colors_en:
            choices = []
            ind = [i, j, k] = random.sample(range(0, len(colors) - 1), 3)
            cnt = 0
            for i in perm[random.randint(0, len(perm) - 1)]:
                if i == 3:
                    choices.append(colors[cnt_g])
                    answer = cnt
                else:
                    choices.append(colors[ind[i]])
                cnt = cnt + 1

            data.append({
                "question": "<div class='square' style='background-color:" + c + "'></div>",
                "choices": choices,
                "answer": answer,
                "type": "color",
                "intent": "",
                "extra": "Color of"
            })
            cnt_g = cnt_g + 1

    with open('Colors.json', 'w') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    numbers = []
    numbers_en = []
    data = []
    with open('numbers.csv') as f:
        reader = csv.reader(f, delimiter=',')
        for r in reader:
            numbers.append(r[0])
            numbers_en.append(r[2])

        cnt_g = 0
        for c in numbers:
            choices = []
            ind = [i, j, k] = random.sample(range(0, len(numbers_en) - 1), 3)
            cnt = 0
            for i in perm[random.randint(0, len(perm) - 1)]:
                if i == 3:
                    choices.append(numbers_en[cnt_g])
                    answer = cnt
                else:
                    choices.append(numbers_en[ind[i]])
                cnt = cnt + 1

            data.append({
                "question": c,
                "choices": choices,
                "answer": answer,
                "type": "number",
                "intent": "",
                "extra": "The translation of"
            })
            cnt_g = cnt_g + 1

        cnt_g = 0
        for c in numbers_en:
            choices = []
            ind = [i, j, k] = random.sample(range(0, len(numbers) - 1), 3)
            cnt = 0
            for i in perm[random.randint(0, len(perm) - 1)]:
                if i == 3:
                    choices.append(numbers[cnt_g])
                    answer = cnt
                else:
                    choices.append(numbers[ind[i]])
                cnt = cnt + 1

            data.append({
                "question": c,
                "choices": choices,
                "answer": answer,
                "type": "number",
                "intent": "",
                "extra": "The translation of"
            })
            cnt_g = cnt_g + 1

    numbers = []
    numbers_en = []
    with open('numbers.csv') as f:
        reader = csv.reader(f, delimiter=',')
        for r in reader:
            numbers.append(r[2])
            numbers_en.append(r[5])

        cnt_g = 0
        for c in numbers:
            choices = []
            ind = [i, j, k] = random.sample(range(0, len(numbers_en) - 1), 3)
            cnt = 0
            for i in perm[random.randint(0, len(perm) - 1)]:
                if i == 3:
                    choices.append(numbers_en[cnt_g])
                    answer = cnt
                else:
                    choices.append(numbers_en[ind[i]])
                cnt = cnt + 1

            data.append({
                "question": c,
                "choices": choices,
                "answer": answer,
                "type": "number",
                "intent": "",
                "extra": "Write the following number in numerals:"
            })
            cnt_g = cnt_g + 1

        cnt_g = 0
        for c in numbers_en:
            choices = []
            ind = [i, j, k] = random.sample(range(0, len(numbers) - 1), 3)
            cnt = 0
            for i in perm[random.randint(0, len(perm) - 1)]:
                if i == 3:
                    choices.append(numbers[cnt_g])
                    answer = cnt
                else:
                    choices.append(numbers[ind[i]])
                cnt = cnt + 1

            data.append({
                "question": c,
                "choices": choices,
                "answer": answer,
                "type": "number",
                "intent": "",
                "extra": "Write the following number in letters:"
            })
            cnt_g = cnt_g + 1

    with open('Numbers.json', 'w') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    # perm = list(permutations(range(0,len(data))))[random.randint(0,len(data)-1)]
    # perm_data = []
    # for p in perm:
    #     perm_data.append(data[p])

    # random.shuffle(data)
    # data = random.sample(data, 2000)
    # json.dump(data, f2, indent=2, ensure_ascii=False)
