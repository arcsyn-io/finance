package com.lucaskalb.finance.dto;

import com.lucaskalb.finance.model.EntryNature;
import com.lucaskalb.finance.model.ImportSource;
import org.springframework.web.multipart.MultipartFile;

public record CreateImportCommand(
        MultipartFile file,
        ImportSource source,
        Long walletId,
        Long categoryId,
        EntryNature nature
) {}
