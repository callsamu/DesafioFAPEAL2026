import { Request, Response } from 'express';

type Handler = (req: Request, res: Response) => void;

export const healthcheck: Handler = (req, res) => {
    res.status(200).json({ status: 'ok' })
};