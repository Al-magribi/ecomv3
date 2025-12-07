import { Router } from "express";
import { authorize } from "../../middleware/authorize.js";
import { withQuery, withTransaction } from "../../utils/dbWrapper.js";

const router = Router();

router.get(
  "/get-mid-config",
  authorize("user"),
  withQuery(async (req, res, pool) => {
    const configQuery = `
        SELECT key, value 
        FROM configurations 
        WHERE key 
        IN ('midtrans_server_key', 'midtrans_client_key', 'midtrans_merchant_id', 'midtrans_base_url', 'midtrans_is_production')
      `;
    const configResult = await pool.query(configQuery);
    const configMap = configResult.rows.reduce((acc, row) => {
      acc[row.key] = row.value;
      return acc;
    }, {});

    const clientKey = configMap["midtrans_client_key"];
    const midtransBaseUrl = configMap["midtrans_base_url"];

    res.status(200).json({ clientKey, midtransBaseUrl });
  })
);

export default router;
