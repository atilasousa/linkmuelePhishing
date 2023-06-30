export const optionsVirusTotalPost = (url = null) => {
  return {
    method: "POST",
    headers: {
      accept: "application/json",
      "x-apikey":
        "7e580ce5a657a49226edb9b58790914878649fe7d4185555dbc9470c7bce7215",
      "content-type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ url: url }),
  };
};

export const optionsVirusTotalGet = {
  method: "GET",
  headers: {
    accept: "application/json",
    "x-apikey":
      "7e580ce5a657a49226edb9b58790914878649fe7d4185555dbc9470c7bce7215",
  },
};
