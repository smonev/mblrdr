import lxml.etree


class OutlineElement(object):

    def __init__(self, root):
        self._root = root

    def __getattr__(self, attr):
        if attr in self._root.attrib:
            return self._root.attrib[attr]

        raise AttributeError()

    @property
    def _outlines(self):
        return [OutlineElement(n) for n in self._root.xpath('./outline')]

    def __len__(self):
        return len(self._outlines)

    def __getitem__(self, index):
        return self._outlines[index]


class Opml(object):

    def __init__(self, xml_tree):
        self._tree = xml_tree

    def __getattr__(self, attr):
        result = self._tree.xpath('/opml/head/%s/text()' % attr)
        if len(result) == 1:
            return result[0]

        raise AttributeError()

    @property
    def _outlines(self):
        return [OutlineElement(n) for n in self._tree.xpath(
                '/opml/body/outline')]

    def __len__(self):
        return len(self._outlines)

    def __getitem__(self, index):
        return self._outlines[index]


def from_string(opml_text):
    return Opml(lxml.etree.fromstring(opml_text))


def parse(opml_url):
    return Opml(lxml.etree.parse(opml_url))
