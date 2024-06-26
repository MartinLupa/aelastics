/** @jsx hm */
import { hm } from './../../index';
import { M2T, M2T_Model, IParagraph, ISection } from "../index";
import { Dir, Doc, P, Sec } from "../index";
import { IDirectory, IDocument } from "../index";
import { ModelStore, Context, Element } from './../../index';

const testStore = new ModelStore();

let testDoc1Element: Element<IDocument> = (
    <Doc name="TestDoc1.txt">
        <P>{"some text"}</P>
    </Doc>
);

let testDoc2Element: Element<IDocument> = (
    <Doc name="TestDoc2.txt">
        <P>{`some text for Math.log2(8)=${Math.log2(8)}`}</P>
    </Doc>
);

let dir1Element: Element<IDirectory> = (
    <Dir name="directory1">
        {testDoc1Element}
        <Dir name="subDir1">
            {testDoc2Element}
        </Dir>
    </Dir>
);

let testModel1_Element: Element<M2T_Model> = (
    <M2T name="test model1" store={testStore}>
        {testDoc1Element}
    </M2T>
);

let testModel2_Element: Element<M2T_Model> = (
    <M2T name="test model2" store={testStore}>
        {testDoc2Element}
    </M2T>
);


let Doc1TopDir = <Doc name="Doc1">
    <P>Title Doc1</P>
    <Sec name="Chapter 1">
        <Sec name="Subchapter 1.1">
            <P>text of Subchapter 1.1</P>
        </Sec>
        <P>text of at end of Chapter 1</P>
    </Sec>
    <Sec name="Chapter 2">
        <Sec name="Subchapter 2.1"></Sec>
        <P>text of Subchapter 2.1</P>
    </Sec>
    <P>Conclusions</P>
</Doc>

let testModel3_Element: Element<M2T_Model> = (
    <M2T name="test model3" store={testStore}>
        <Dir name="TopDir">
            {Doc1TopDir}
            <Dir name="Subdir1"></Dir>
            <Dir name="Subdir2"></Dir>
        </Dir>
    </M2T>
);

describe("test text generation", () => {
    it("should generate correct document content for testModel1", () => {
        const testDoc1: M2T_Model = testModel1_Element.render(new Context());
        expect(testDoc1.elements).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ name: "TestDoc1.txt" }),
                expect.objectContaining({ txtContent: "some text" })
            ])

        )
    });

    it("should generate correct document content for testModel2", () => {
        const testDoc2: M2T_Model = testModel2_Element.render(new Context());
        expect(testDoc2.elements).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ name: "TestDoc2.txt" }),
                expect.objectContaining({ txtContent: "some text for Math.log2(8)=3" })
            ])

        )
        const doc = testDoc2.elements[0] as IDocument
        expect(doc.elements).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ txtContent: "some text for Math.log2(8)=3" })
            ])

        )
    });

    it("should generate correct document content for testModel3", () => {
        const testDoc3: M2T_Model = testModel3_Element.render(new Context());
        expect(testDoc3.elements).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ name: "TopDir" }),
                expect.objectContaining({ name: "Subdir1" }),
                expect.objectContaining({ name: "Subdir2" }),
                expect.objectContaining({ name: "Doc1" }),
                expect.objectContaining({ txtContent: "Title Doc1" }),
                expect.objectContaining({ txtContent: "text of Subchapter 1.1" }),
                expect.objectContaining({ txtContent: "text of at end of Chapter 1" }),
                expect.objectContaining({ txtContent: "text of Subchapter 2.1" }),
                expect.objectContaining({ txtContent: "Conclusions" }),
                expect.objectContaining({ label: "Chapter 1" }),
                expect.objectContaining({ label: "Subchapter 1.1" }),
                expect.objectContaining({ label: "Chapter 2" }),
                expect.objectContaining({ label: "Subchapter 2.1" }),
            ])
        )
        let topDir = testDoc3.elements[0] as IDirectory
        expect(topDir.items).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ name: "Subdir1" }),
                expect.objectContaining({ name: "Subdir2" }),
                expect.objectContaining({ name: "Doc1" }),
            ])
        )
        let doc1 = topDir.items[0] as IDocument
        expect(doc1.elements).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ txtContent: "Title Doc1" }),
                expect.objectContaining({ label: "Chapter 1" }),
                expect.objectContaining({ label: "Chapter 2" }),
            ])
        )
        let sec1 = doc1.elements[1] as ISection
        expect(sec1.elements).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ txtContent: "text of at end of Chapter 1" }),
                expect.objectContaining({ label: "Subchapter 1.1" }),
            ])
        )
    });
});

