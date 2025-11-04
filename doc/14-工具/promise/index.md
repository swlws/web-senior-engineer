# Promise

## http 请求并发

```js
function httpRequest(params) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(params);
    }, Math.random() * 2000);
  });
}

function createPool(httpRequest, { limit = 2 }) {
  let size = 0;
  const taskList = [];
  const doHttpRequest = async ({ params, resolve, reject }) => {
    try {
      const res = await httpRequest(params);
      resolve(res);
    } catch (error) {
      reject(error);
    } finally {
      size--;
      if (taskList.length) {
        const nextTask = taskList.shift();
        doHttpRequest(nextTask);
      }
    }
  };
  return (params) => {
    return new Promise((resolve, reject) => {
      if (size < limit) {
        size++;
        doHttpRequest({ params, resolve, reject });
      } else {
        taskList.push({ params, resolve, reject });
      }
    });
  };
}

const fetchData = createPool(httpRequest, { limit: 2 });

for (let i = 0; i < 10; i++) {
  fetchData({ id: i }).then((res) => {
    console.log(res);
  });
}
```
