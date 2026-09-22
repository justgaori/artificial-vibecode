# InkNet · 손글씨 숫자 인식

브라우저에서 숫자를 쓰면, 미리 학습된 CNN이 **0–9** 중 무엇인지 바로 알려 줍니다.
그림은 서버로 보내지 않고, [TensorFlow.js](https://www.tensorflow.org/js)가 기기 안에서 추론합니다.

## 사용 방법

1. 캔버스에 **숫자 한 글자**를 크게 씁니다.
2. 손을 떼면 자동으로 인식합니다. `인식하기`를 눌러 다시 볼 수도 있습니다.
3. 오른쪽에서 예측 숫자, 신뢰도, 0–9 확률 막대를 확인합니다.

로컬에서 열려면:

```bash
npx --yes serve -l 5173
```

브라우저에서 `http://localhost:5173` 으로 접속합니다.

## 동작 방식

1. 캔버스에서 잉크가 있는 영역을 잘라 냅니다.
2. MNIST와 비슷하게 **28×28**, 흰 글씨·검은 배경으로 맞춥니다.
3. Keras CNN(`Conv2D → Conv2D → MaxPool → Dense`)에 넣어 10개 클래스 확률을 얻습니다.

학습 데이터는 [MNIST](http://yann.lecun.com/exdb/mnist/) 손글씨 숫자입니다. 글자·한글은 이 모델의 범위가 아닙니다.

## 기술 스택

- HTML / CSS / JavaScript
- TensorFlow.js 4.22
- 사전학습 MNIST CNN 가중치

## 라이선스

MIT
