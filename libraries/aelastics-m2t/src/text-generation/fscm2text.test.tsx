/** @jsx hm */
import { hm } from "aelastics-synthesis";
import { FileModel, IFS_Model, IParagraph } from "../index";
import { Dir, Doc, P, Sec } from "../index";
import { IDirectory, IDocument } from "../index";
import { ModelStore, Context, Element } from "aelastics-synthesis";

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

let testModel1_Element: Element<IFS_Model> = (
    <FileModel name="test model1" store={testStore}>
        {testDoc1Element}
    </FileModel>
);

let testModel2_Element: Element<IFS_Model> = (
    <FileModel name="test model2" store={testStore}>
        {testDoc2Element}
    </FileModel>
);

describe("test text generation", () => {
    it("should generate correct document content for testModel1", () => {
        const testDoc1:IFS_Model = testModel1_Element.render(new Context());
        expect(testDoc1.elements).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ name:"TestDoc1.txt"}),
                expect.objectContaining({ txtContent:"some text"})
            ])
           
        )
    });

    it("should generate correct document content for testModel2", () => {
        const testDoc2:IFS_Model = testModel2_Element.render(new Context());
        expect(testDoc2.elements).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ name:"TestDoc2.txt"}),
                expect.objectContaining({ txtContent:"some text for Math.log2(8)=3"})
            ])
           
        )
        const doc = testDoc2.elements[0] as IDocument
        expect(doc.elements).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ txtContent:"some text for Math.log2(8)=3"})
            ])
           
        )  
    });
});

