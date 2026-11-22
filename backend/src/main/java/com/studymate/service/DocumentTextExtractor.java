package com.studymate.service;

import org.apache.tika.exception.TikaException;
import org.apache.tika.metadata.Metadata;
import org.apache.tika.parser.AutoDetectParser;
import org.apache.tika.parser.ParseContext;
import org.apache.tika.sax.BodyContentHandler;
import org.springframework.stereotype.Component;
import org.xml.sax.SAXException;

import java.io.IOException;
import java.nio.file.Path;

@Component
public class DocumentTextExtractor {
    private static final int MAX_TEXT_CHARS = 120_000;

    public String extract(Path file) {
        BodyContentHandler content = new BodyContentHandler(MAX_TEXT_CHARS);
        try (var stream = org.apache.tika.io.TikaInputStream.get(file)) {
            new AutoDetectParser().parse(stream, content, new Metadata(), new ParseContext());
        } catch (SAXException limitReached) {
            // BodyContentHandler stops parsing once enough text has been collected.
        } catch (IOException | TikaException | RuntimeException ex) {
            return "";
        }
        return content.toString().replaceAll("\\s+", " ").trim();
    }
}
