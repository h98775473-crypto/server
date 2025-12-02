import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());

// CiNii OpenSearch APIへのプロキシエンドポイント 要は本探しAPI用URL処理

app.get("/cinii-proxy/opensearch/all",async(req,res) => {
    const ciniiApiBaseDomain = 'https://cir.nii.ac.jp/opensearch/all';

    // クエリパラメータをそのまま取得
    const queryParams = new URLSearchParams(req.query);

    const apiUrl = `${ciniiApiBaseDomain}?appid=lkCMwUK6QCKUCW6yJoC8&${queryParams.toString()}`;

    //console.log(`Proxying request to: ${apiUrl}`);

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            const errorText = await response.text();
            return res.status(response.status).send(errorText);
        }

        const contentType = response.headers.get('content-type');
        res.setHeader('Content-Type', contentType || 'application/xml');

        const data = await response.text();
        res.send(data);

    } catch (error) {
        console.error('Error proxying request to CiNii Articles API:', error);
        res.status(500).json({ error: 'Failed to fetch data from CiNii Articles API', details: error.message });
    }
});

// CiNii OpenSearch APIへのプロキシエンドポイント 要は著者探しAPI用URL処理

app.get("/cinii-proxy/opensearch/author",async(req,res) => {
    

    //const ciniiApiBaseDomain = 'https://cir.nii.ac.jp/opensearch/author';

    const ciniiApiBaseDomain = `https://cir.nii.ac.jp/crid/`;

    // クエリパラメータをそのまま取得
    //const queryParams = new URLSearchParams(req.query);

    const queryParams = req.query.q;

    //const apiUrl = `${ciniiApiBaseDomain}?${queryParams.toString()}`;
    let apiUrl = `${ciniiApiBaseDomain}${queryParams}.json`;

    //console.log(`Proxying request to: ${apiUrl}`);

    try {
        let response = await (await fetch(apiUrl)).json();
        let temp = response;
        let data = "";

        try{
            for (let i=0;i<Object.keys(response["creator"]).length;i++){
                apiUrl=`${response["creator"][i]["@id"]}.json`
                //console.log("Proxying request to: "+apiUrl);
                temp = await(await fetch(apiUrl)).json();
                data += temp["career"][0]["institution"]["notation"][0]["@value"]+"//";
            }
        } catch(error) {
            //console.log("not found");
        }

        response = data.split("//");

        res.send(response);

    } catch (error) {
        console.error('Error proxying request to CiNii Articles API:', error);
        //res.status(500).json({ error: 'Failed to fetch data from CiNii Articles API', details: error.message });
    }
});


// サーバーの起動
app.listen(PORT, () => {
	console.log(PORT);
});