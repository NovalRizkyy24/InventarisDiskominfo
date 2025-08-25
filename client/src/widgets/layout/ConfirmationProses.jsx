import React from "react";
import {
  Button,
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
  Typography,
} from "@material-tailwind/react";
import { QuestionMarkCircleIcon } from "@heroicons/react/24/outline";

export function ConfirmationProses({ 
  open, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  actionText = "Ya, Lanjutkan", 
  actionColor = "green" 
}) {
  return (
    <Dialog open={open} handler={onClose} size="sm">
      <DialogHeader>
        {/* --- PERBAIKAN: Beri nilai default jika title kosong --- */}
        <Typography variant="h5" color="blue-gray">
          {title || 'Konfirmasi'}
        </Typography>
      </DialogHeader>
      <DialogBody divider className="grid place-items-center gap-4">
        <QuestionMarkCircleIcon className="h-16 w-16 text-blue-gray-500" />
        <Typography color="blue-gray" variant="h4">
          Anda Yakin?
        </Typography>
        {/* --- PERBAIKAN: Beri nilai default jika message kosong --- */}
        <Typography className="text-center font-normal">
          {message || 'Apakah Anda ingin melanjutkan proses ini?'}
        </Typography>
      </DialogBody>
      <DialogFooter className="space-x-2">
        <Button variant="text" color="blue-gray" onClick={onClose}>
          Batal
        </Button>
        <Button variant="gradient" color={actionColor} onClick={onConfirm}>
          {actionText}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}

export default ConfirmationProses;